import { describe, expect, it } from "vitest";
import { createConfigurationLoader } from "./editor-mode.js";

type Response = { data?: { editorMode?: unknown; richTextDataType?: string | null } };

/** A fake server that answers each request with the next queued response. */
function fakeServer(...responses: Array<() => Promise<Response>>) {
  let requests = 0;
  const fetchConfiguration = () => responses[requests++]();
  return { fetchConfiguration, requests: () => requests };
}

const configured = (editorMode: "Rte" | "Markdown") => () => Promise.resolve({ data: { editorMode } });
const errorResponse = () => Promise.resolve({ data: undefined });
const networkFailure = () => Promise.reject(new TypeError("Failed to fetch"));

describe("createConfigurationLoader", () => {
  it("resolves to the mode the server is configured with", async () => {
    const server = fakeServer(configured("Markdown"));
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    const configuration = await getConfiguration();

    expect(configuration?.editorMode).toBe("Markdown");
  });

  it("passes the rest of the configuration through", async () => {
    const withDataType = () => Promise.resolve({ data: { editorMode: "Rte", richTextDataType: "Dictionary RTE" } });
    const server = fakeServer(withDataType);
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    const configuration = await getConfiguration();

    expect(configuration).toEqual({ editorMode: "Rte", richTextDataType: "Dictionary RTE" });
  });

  it("asks the server only once when the first request succeeds", async () => {
    const server = fakeServer(configured("Rte"), configured("Markdown"));
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    await getConfiguration();
    const configuration = await getConfiguration();

    expect({ mode: configuration?.editorMode, requests: server.requests() }).toEqual({ mode: "Rte", requests: 1 });
  });

  it("resolves to undefined when the server returns an error", async () => {
    const server = fakeServer(errorResponse);
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    const configuration = await getConfiguration();

    expect(configuration).toBeUndefined();
  });

  it("resolves to undefined for a mode it doesn't recognise", async () => {
    const numericEnum = () => Promise.resolve({ data: { editorMode: 0 } });
    const server = fakeServer(numericEnum);
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    const configuration = await getConfiguration();

    expect(configuration).toBeUndefined();
  });

  it("resolves to undefined when the request fails", async () => {
    const server = fakeServer(networkFailure);
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    const configuration = await getConfiguration();

    expect(configuration).toBeUndefined();
  });

  it("tries again after a failed request", async () => {
    const server = fakeServer(networkFailure, configured("Rte"));
    const getConfiguration = createConfigurationLoader(server.fetchConfiguration);

    await getConfiguration();
    const configuration = await getConfiguration();

    expect(configuration?.editorMode).toBe("Rte");
  });
});
