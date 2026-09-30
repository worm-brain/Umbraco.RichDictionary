/**
 * The core dictionary "Edit" workspace view, with its plain textareas. The entry point excludes it
 * so that only our view renders; uninstalling the package brings it back unchanged.
 */
export const CORE_DICTIONARY_EDIT_VIEW_ALIAS = "Umb.WorkspaceView.Dictionary.Edit";

/**
 * The core dictionary detail repository, which the core dictionary workspace loads and saves items
 * through.
 */
export const CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS = "Umb.Repository.Dictionary.Detail";
