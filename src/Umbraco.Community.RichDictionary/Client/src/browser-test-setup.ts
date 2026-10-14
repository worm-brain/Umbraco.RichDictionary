// Setup for the browser component tests (vitest.browser.config.ts). It recreates the two things a
// running back-office provides globally and the elements rely on: the UUI element library, and the
// core Tiptap extensions registered in the extension registry, which the core `umb-input-tiptap`
// looks up by alias when it builds its editor.
import "@umbraco-cms/backoffice/external/uui";
import { umbExtensionsRegistry } from "@umbraco-cms/backoffice/extension-registry";
// The package's `exports` map doesn't expose the Tiptap package registration, so it's imported by
// file path. It's the same manifest list the back-office registers for Tiptap at startup.
import { manifests as tiptapManifests } from "../node_modules/@umbraco-cms/backoffice/dist-cms/packages/tiptap/umbraco-package.js";

umbExtensionsRegistry.registerMany(tiptapManifests);
