import { UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";
import { UMB_DICTIONARY_WORKSPACE_ALIAS } from "@umbraco-cms/backoffice/dictionary";

// Label, pathname, icon and weight match the core view it replaces, so tabs and deep links
// (`.../edit/:unique/view/edit`) behave identically.
export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "workspaceView",
    alias: "Umbraco.RichDictionary.WorkspaceView.Dictionary.Edit",
    name: "Rich Dictionary Workspace Edit View",
    element: () => import("./workspace-view.element.js"),
    weight: 100,
    meta: {
      label: "#general_edit",
      pathname: "edit",
      icon: "edit",
    },
    conditions: [{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: UMB_DICTIONARY_WORKSPACE_ALIAS }],
  },
];
