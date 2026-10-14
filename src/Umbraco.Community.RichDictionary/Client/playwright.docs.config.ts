import { defineConfig } from "@playwright/test";
import { sites } from "./e2e/support/sites.js";
import type { E2eOptions } from "./e2e/support/test.js";

/**
 * Takes the documentation screenshots in `docs/images/` (`bun run docs:screenshots`), from the
 * Umbraco 17 sample site. It reuses a site already running on its own launch port (44440,
 * `dotnet run` in `samples/RichDictionary.Site17`), or starts one there. The shots seed sample
 * languages and dictionary items into that site's database (e2e/docs/screenshots.docs.ts).
 *
 * Signing in starts a new backoffice session for the admin, which ends any other session of that
 * user on the site unless concurrent logins are allowed.
 */
const port = Number(process.env.DOCS_SITE_PORT ?? 44440);
const site17 = sites.find((site) => site.name === "site17");
if (!site17) throw new Error("E2E_SITES must include 17 for the documentation screenshots.");
const site = { ...site17, port, baseURL: `https://localhost:${port}` };

export default defineConfig<E2eOptions>({
  testDir: "e2e/docs",
  testMatch: /\.docs\.ts$/,
  outputDir: "e2e/test-results",
  // One worker, one session: the shots run in order and share the seeded items.
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    ignoreHTTPSErrors: true,
    // Scale 1.5 keeps text sharp on high-density screens at the size the README shows the shots;
    // each shot sets its own viewport.
    deviceScaleFactor: 1.5,
    locale: "en-GB",
    colorScheme: "light",
    site,
    baseURL: site.baseURL,
  },
  webServer: {
    command: `dotnet run --no-build --no-launch-profile --urls https://localhost:${port}`,
    cwd: site.projectDir,
    env: { ASPNETCORE_ENVIRONMENT: "Development", RichDictionary__EditorMode: "Rte" },
    url: `${site.baseURL}/umbraco`,
    ignoreHTTPSErrors: true,
    timeout: 600_000,
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
