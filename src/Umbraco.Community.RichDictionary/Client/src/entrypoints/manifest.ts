export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Umbraco Community Rich Dictionary Entrypoint",
    alias: "Umbraco.RichDictionary.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
