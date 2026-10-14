// Editing a dictionary value in each editor mode, through the package's workspace view on a real
// backoffice: what the user types is what Umbraco stores, in the mode's format, and it opens again
// unchanged.
import {
  ENGLISH,
  createItem,
  deleteItem,
  markdownLines,
  openItem,
  richTextField,
  save,
  startNewItem,
  uniqueName,
  useEditorMode,
} from "./support/dictionary.js";
import { expect, test } from "./support/test.js";

/** Keys of the items a test created, deleted after it. */
let created: Array<string> = [];

test.beforeEach(() => {
  created = [];
});

test.afterEach(async ({ page }) => {
  for (const id of created) await deleteItem(page, id);
});

test.describe("Rte mode", () => {
  test("stores a formatted value as HTML and opens it again", async ({ page }) => {
    await startNewItem(page, uniqueName("Rte"));
    const field = richTextField(page);
    await field.click();
    await page.keyboard.type("Free delivery");
    await page.keyboard.press("ControlOrMeta+A");
    await page.getByRole("button", { name: "Bold" }).first().click();

    const saved = await save(page);
    created.push(saved.id);

    expect(saved.translations[ENGLISH.isoCode]).toBe("<p><strong>Free delivery</strong></p>");
    await page.reload();
    await expect(richTextField(page).locator("strong")).toHaveText("Free delivery");
  });

  test("shows a plain-text legacy value as text, with its line breaks", async ({ page }) => {
    const id = await createItem(page, uniqueName("Legacy"), { [ENGLISH.isoCode]: "Acme Ltd\nLondon" });
    created.push(id);

    await openItem(page, id);

    await expect(richTextField(page).locator("p")).toHaveText("Acme LtdLondon");
    await expect(richTextField(page).locator("p br")).toHaveCount(1);
  });
});

test.describe("Markdown mode", () => {
  test.beforeEach(async ({ page }) => {
    await useEditorMode(page, "Markdown");
  });

  test("stores the typed Markdown as is and opens it again", async ({ page }) => {
    await startNewItem(page, uniqueName("Markdown"));
    await markdownLines(page).click();
    await page.keyboard.type("Free **delivery**");

    const saved = await save(page);
    created.push(saved.id);

    expect(saved.translations[ENGLISH.isoCode]).toBe("Free **delivery**");
    await page.reload();
    await expect(markdownLines(page)).toHaveText("Free **delivery**");
  });
});
