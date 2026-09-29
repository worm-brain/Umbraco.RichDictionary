import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { client } from "../api/client.gen.js";
import { CORE_DICTIONARY_EDIT_VIEW_ALIAS } from "../dictionary-editor/constants.js";

/**
 * Back-office entry point. Hides the core dictionary edit view that the package replaces, then
 * points the generated Management API client at the current Umbraco instance and authenticates it
 * as the logged-in back-office user.
 *
 * @param host - The host element the entry point is attached to, used to consume contexts.
 * @param extensionRegistry - The back-office extension registry.
 */
export const onInit: UmbEntryPointOnInit = (host, extensionRegistry) => {
  // Unregisters the core view if it's already registered, and blocks it if it registers later.
  extensionRegistry.exclude(CORE_DICTIONARY_EDIT_VIEW_ALIAS);

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
