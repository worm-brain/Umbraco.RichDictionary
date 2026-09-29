import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { client } from "../api/client.gen.js";

/**
 * Back-office entry point. Points the generated Management API client at the current Umbraco
 * instance and authenticates it as the logged-in back-office user.
 *
 * @param host - The host element the entry point is attached to, used to consume contexts.
 */
export const onInit: UmbEntryPointOnInit = (host) => {
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    const config = authContext?.getOpenApiConfiguration();

    client.setConfig({
      auth: config?.token ?? undefined,
      baseUrl: config?.base ?? "",
      credentials: config?.credentials ?? "same-origin",
    });
  });
};

/**
 * Back-office entry point teardown. Required by the entry point module contract; there is
 * nothing to clean up yet, because the auth context subscription ends with the host.
 */
export const onUnload: UmbEntryPointOnUnload = () => {};
