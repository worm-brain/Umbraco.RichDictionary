import { defineConfig, type PlaywrightTestProject } from "@playwright/test";
import { sites } from "./e2e/support/sites.js";
import type { E2eOptions } from "./e2e/support/test.js";

const ci = !!process.env.CI;

/**
 * The e2e suite: runs every spec against each selected sample site (`E2E_SITES`), starting the
 * sites itself. `bun run e2e` builds the client and the sites first (`e2e/prepare.ts`).
 */
export default defineConfig<E2eOptions>({
  testDir: "e2e",
  testIgnore: "docs/**",
  outputDir: "e2e/test-results",
  // One test at a time: every test writes dictionary items, and parallel writes to the sample sites'
  // SQLite databases (next to each worker's token refreshes) stalled backoffice requests until the
  // tests timed out. The suite is small, so serial costs little.
  fullyParallel: false,
  workers: 1,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: ci
    ? [["github"], ["html", { open: "never", outputFolder: "e2e/playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "e2e/playwright-report" }]],
  use: {
    // The sites use the ASP.NET Core development certificate, which CI does not trust.
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
    locale: "en-GB",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // One project per site. There is no shared saved login: each worker logs in (e2e/support/test.ts).
  projects: sites.map((site): PlaywrightTestProject<E2eOptions> => ({
    name: site.name,
    testMatch: /\.spec\.ts/,
    use: { site, baseURL: site.baseURL },
  })),
  webServer: sites.map((site) => ({
    // --no-build: e2e/prepare.ts has built the client and the site, in that order.
    command: `dotnet run --no-build --no-launch-profile -p:UmbracoMajor=${site.major} --urls https://localhost:${site.port}`,
    cwd: site.projectDir,
    env: {
      ASPNETCORE_ENVIRONMENT: "Development",
      // The sites run in Rte mode; the Markdown specs switch the client by answering the
      // configuration request themselves (e2e/support/dictionary.ts).
      RichDictionary__EditorMode: "Rte",
      // Every worker logs in as the same admin (e2e/support/auth.ts). With concurrent logins off,
      // each login revokes every other session of that user, so parallel workers would sign each
      // other out.
      Umbraco__CMS__Security__AllowConcurrentLogins: "true",
    },
    // Answers once Umbraco has booted; on a fresh database that includes the unattended install.
    url: `${site.baseURL}/umbraco`,
    ignoreHTTPSErrors: true,
    timeout: 300_000,
    // Locally, a site already running on the e2e port is used as is, so start it with the env
    // above (at least AllowConcurrentLogins), or parallel workers sign each other out.
    reuseExistingServer: !ci,
    stdout: "ignore",
    stderr: "pipe",
  })),
});
