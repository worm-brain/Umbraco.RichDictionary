/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
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
    include: ["src/**/*.test.ts"],
  },
});
