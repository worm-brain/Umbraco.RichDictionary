# ADR 0015: Run the e2e suite with plain Playwright, one test at a time

- Status: Accepted
- Date: 2026-10-14

## Context

The unit and component tests run the editors against a stub page. Nothing checked that editing a
dictionary item in a real backoffice stores the right value in each mode, on each major.

## Decision

- A plain `@playwright/test` suite in `Client/e2e/`, with `@axe-core/playwright`, runs against both
  sample sites. Playwright starts the sites on their own e2e ports (44444 and 44454).
- The sites run in `Rte` mode. The Markdown specs answer the package's configuration request
  themselves, because a site needs a restart to change mode. The server side of the setting is
  covered by the unit tests and the package smoke test.
- Each test creates and deletes its own dictionary items through the Management API.
- Tests run one at a time. They write to the sample sites' SQLite databases, and parallel writes,
  next to each worker's token refreshes, stalled backoffice requests until the tests timed out.
- A separate Playwright config (`playwright.docs.config.ts`) takes the documentation screenshots
  from the Umbraco 17 sample site.

## Consequences

- `e2e.yml` runs the suite per major on pull requests.
- The screenshots in `docs/images/` are retaken with one command when the UI changes.
