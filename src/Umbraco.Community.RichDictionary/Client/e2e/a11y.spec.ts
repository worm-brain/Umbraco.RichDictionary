// axe reports no serious or critical accessibility issues on a dictionary item open in the
// package's editor, in each editor mode.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import {
  ENGLISH,
  createItem,
  deleteItem,
  markdownLines,
  openItem,
  richTextField,
  uniqueName,
  useEditorMode,
} from "./support/dictionary.js";
import { expect, test } from "./support/test.js";

/** The impacts that fail the check; minor and moderate findings are not enforced. */
const FAILING_IMPACTS = new Set(["serious", "critical"]);

/**
 * Runs axe on the page and returns its serious and critical violations, one line per rule with
 * the offending targets, so a failure reads as a list.
 *
 * The whole page is scanned, backoffice chrome included, because `AxeBuilder.include` cannot
 * select inside the backoffice's nested shadow roots. Add any exclusion as a narrow `exclude()`
 * with the reason beside it.
 */
async function seriousViolations(page: Page): Promise<Array<string>> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((violation) => FAILING_IMPACTS.has(violation.impact ?? ""))
    .map(
      (violation) =>
        `${violation.impact} ${violation.id}: ${violation.help} -> ${violation.nodes
          .map((node) => JSON.stringify(node.target))
          .join(", ")}`,
    );
}

let created = "";

test.afterEach(async ({ page }) => {
  await deleteItem(page, created);
});

test("Rte mode: the open item has no serious accessibility issues", async ({ page }) => {
  created = await createItem(page, uniqueName("A11yRte"), {
    [ENGLISH.isoCode]: "<p><strong>Free</strong> delivery</p>",
  });

  await openItem(page, created);
  await expect(richTextField(page).locator("strong")).toHaveText("Free");

  expect(await seriousViolations(page)).toEqual([]);
});

test("Markdown mode: the open item has no serious accessibility issues", async ({ page }) => {
  await useEditorMode(page, "Markdown");
  created = await createItem(page, uniqueName("A11yMarkdown"), { [ENGLISH.isoCode]: "**Free** delivery" });

  await openItem(page, created);
  await expect(markdownLines(page)).toHaveText("**Free** delivery");

  expect(await seriousViolations(page)).toEqual([]);
});
