import { describe, expect, it } from "vitest";
import { createEditorModeLoader } from "./editor-mode.js";

/** A fake server that answers each request with the next queued response. */
function fakeServer(...responses: Array<() => Promise<{ data?: { editorMode?: unknown } }>>) {
  let requests = 0;
  const fetchConfiguration = () => responses[requests++]();
  return { fetchConfiguration, requests: () => requests };
}

const configured = (editorMode: "Rte" | "Markdown") => () => Promise.resolve({ data: { editorMode } });
const errorResponse = () => Promise.resolve({ data: undefined });
const networkFailure = () => Promise.reject(new TypeError("Failed to fetch"));

describe("createEditorModeLoader", () => {
  it("resolves to the mode the server is configured with", async () => {
    const server = fakeServer(configured("Markdown"));
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    const mode = await getEditorMode();

    expect(mode).toBe("Markdown");
  });

  it("asks the server only once when the first request succeeds", async () => {
    const server = fakeServer(configured("Rte"), configured("Markdown"));
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    await getEditorMode();
    const mode = await getEditorMode();

    expect({ mode, requests: server.requests() }).toEqual({ mode: "Rte", requests: 1 });
  });

  it("resolves to undefined when the server returns an error", async () => {
    const server = fakeServer(errorResponse);
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    const mode = await getEditorMode();

    expect(mode).toBeUndefined();
  });

  it("resolves to undefined for a mode it doesn't recognise", async () => {
    const numericEnum = () => Promise.resolve({ data: { editorMode: 0 } });
    const server = fakeServer(numericEnum);
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    const mode = await getEditorMode();

    expect(mode).toBeUndefined();
  });

  it("resolves to undefined when the request fails", async () => {
    const server = fakeServer(networkFailure);
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    const mode = await getEditorMode();

    expect(mode).toBeUndefined();
  });

  it("tries again after a failed request", async () => {
    const server = fakeServer(networkFailure, configured("Rte"));
    const getEditorMode = createEditorModeLoader(server.fetchConfiguration);

    await getEditorMode();
    const mode = await getEditorMode();

    expect(mode).toBe("Rte");
  });
});
