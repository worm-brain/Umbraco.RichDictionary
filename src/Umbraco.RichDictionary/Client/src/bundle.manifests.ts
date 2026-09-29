import { manifests as entrypoints } from "./entrypoints/manifest.js";

/**
 * Every manifest the package registers. `umbraco-package.json` loads this bundle; each feature
 * folder exports its own `manifests` array, which is spread in here.
 */
export const manifests: Array<UmbExtensionManifest> = [...entrypoints];
