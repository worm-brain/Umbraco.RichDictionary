/**
 * The core dictionary "Edit" workspace view, with its plain textareas. The entry point excludes it
 * so that only our view renders; uninstalling the package brings it back unchanged.
 */
export const CORE_DICTIONARY_EDIT_VIEW_ALIAS = "Umb.WorkspaceView.Dictionary.Edit";

/**
 * The core dictionary detail repository, which the core dictionary workspace saves through. The
 * entry point swaps in {@link DICTIONARY_DETAIL_REPOSITORY_MANIFEST} under this alias.
 */
export const CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS = "Umb.Repository.Dictionary.Detail";

/**
 * Our replacement for the core dictionary detail repository. It keeps the core alias because the
 * core workspace looks its repository up by that alias; only the save differs (see
 * `dictionary-detail.repository.ts`).
 */
export const DICTIONARY_DETAIL_REPOSITORY_MANIFEST: UmbExtensionManifest = {
  type: "repository",
  alias: CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS,
  name: "Rich Dictionary Detail Repository",
  api: () => import("./dictionary-detail.repository.js"),
};
