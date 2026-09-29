import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UmbElement } from "@umbraco-cms/backoffice/element-api";
import type { UmbExtensionRegistry } from "@umbraco-cms/backoffice/extension-api";

// Replace the generated client so the test can observe the config the entry point applies.
vi.mock("../api/client.gen.js", () => ({ client: { setConfig: vi.fn() } }));
// The real auth module pulls in the whole back-office; only the context token is needed here.
vi.mock("@umbraco-cms/backoffice/auth", () => ({ UMB_AUTH_CONTEXT: "UMB_AUTH_CONTEXT" }));

const { client } = await import("../api/client.gen.js");
const { onInit } = await import("./entrypoint.js");

/** Builds a host whose `consumeContext` immediately hands the callback the given auth context. */
function hostWithAuthContext(authContext: unknown): UmbElement {
  return {
    consumeContext: (_token: unknown, callback: (context: unknown) => void) => callback(authContext),
  } as unknown as UmbElement;
}

const registry = {} as UmbExtensionRegistry<UmbExtensionManifest>;

describe("onInit", () => {
  beforeEach(() => vi.mocked(client.setConfig).mockClear());

  it("configures the client from the auth context", () => {
    const token = () => Promise.resolve("token");
    const authContext = {
      getOpenApiConfiguration: () => ({ token, base: "https://site", credentials: "include" }),
    };

    onInit(hostWithAuthContext(authContext), registry);

    expect(client.setConfig).toHaveBeenCalledWith({ auth: token, baseUrl: "https://site", credentials: "include" });
  });

  it("falls back to same-origin defaults when there is no auth context", () => {
    onInit(hostWithAuthContext(undefined), registry);

    expect(client.setConfig).toHaveBeenCalledWith({ auth: undefined, baseUrl: "", credentials: "same-origin" });
  });
});
