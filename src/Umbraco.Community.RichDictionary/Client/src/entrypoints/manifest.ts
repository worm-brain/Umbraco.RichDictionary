export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Umbraco Community Rich Dictionary Entrypoint",
    alias: "Umbraco.Community.RichDictionary.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
