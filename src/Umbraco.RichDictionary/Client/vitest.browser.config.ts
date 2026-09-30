import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

// Component tests for the Lit elements. They run in a real Chromium (driven by Playwright) because
// shadow DOM and the core Tiptap editor don't work reliably in happy-dom. The happy-dom unit tests
// stay in vite.config.ts; `bun run test:browser` runs this config.
export default defineConfig({
  // The tests load the real core editors, and the core Markdown editor pulls in Monaco. The
  // back-office's own build maps `monaco-editor/<path>` to files in the package; Monaco's `exports`
  // map would otherwise resolve them to `esm/vs/<path>.js`, which doesn't exist. Both packages are
  // served as-is instead of pre-bundled, because esbuild can't pre-bundle Monaco's `?worker` imports.
  resolve: {
    alias: [
      {
        find: /^monaco-editor\/(.*)$/,
        replacement: fileURLToPath(new URL("./node_modules/monaco-editor/$1", import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@umbraco-cms/backoffice", "monaco-editor"],
  },
  test: {
    include: ["src/**/*.browser.test.ts"],
    setupFiles: ["src/browser-test-setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
