import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { client } from "../api/client.gen.js";
import {
  CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS,
  CORE_DICTIONARY_EDIT_VIEW_ALIAS,
  DICTIONARY_DETAIL_REPOSITORY_MANIFEST,
} from "../dictionary-editor/constants.js";

/**
 * Back-office entry point. Hides the core dictionary edit view that the package replaces, swaps the
 * core dictionary detail repository for ours so that saving sends only the languages the user may
 * edit, then points the generated Management API client at the current Umbraco instance and
 * authenticates it as the logged-in back-office user.
 *
 * @param host - The host element the entry point is attached to, used to consume contexts.
 * @param extensionRegistry - The back-office extension registry.
 */
export const onInit: UmbEntryPointOnInit = (host, extensionRegistry) => {
  // Unregisters the core view if it's already registered, and blocks it if it registers later.
  extensionRegistry.exclude(CORE_DICTIONARY_EDIT_VIEW_ALIAS);

  // The core workspace finds its repository by alias, so ours must take over the core alias:
  // `exclude` would block both. If the core repository registers after this, the registry refuses
  // it as a duplicate alias, so ours wins in either order.
  extensionRegistry.unregister(CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS);
  extensionRegistry.register(DICTIONARY_DETAIL_REPOSITORY_MANIFEST);

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
