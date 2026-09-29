export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Umbraco Rich Dictionary Entrypoint",
    alias: "Umbraco.RichDictionary.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
