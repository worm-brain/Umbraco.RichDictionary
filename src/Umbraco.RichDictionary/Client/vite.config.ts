/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { umbracoPackageVersion } from "./scripts/umbraco-package-version.js";

export default defineConfig({
  plugins: [umbracoPackageVersion(fileURLToPath(new URL("../Umbraco.RichDictionary.csproj", import.meta.url)))],
  build: {
    lib: {
      // The bundle entry registers every manifest the package provides.
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "umbraco-rich-dictionary",
    },
    // Build into the Razor Class Library's static web assets so the package serves it from /App_Plugins.
    outDir: "../wwwroot/App_Plugins/UmbracoRichDictionary",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // The back-office provides @umbraco-cms/* (and Lit, Tiptap, etc. through it) at runtime.
      external: [/^@umbraco/],
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    // Component tests need a real browser; vitest.browser.config.ts runs them.
    exclude: ["src/**/*.browser.test.ts"],
  },
});
