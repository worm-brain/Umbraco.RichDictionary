import type { Page } from "@playwright/test";
import {
  ensureLanguages,
  markdownLines,
  openItem,
  richTextField,
  upsertItem,
  useEditorMode,
  type SampleLanguage,
} from "../support/dictionary.js";
import { repoRoot } from "../support/sites.js";
import { expect, test } from "../support/test.js";

/**
 * The documentation screenshots, written to `docs/images/` and shown in the README and the
 * Marketplace listing. Run with `bun run docs:screenshots` (playwright.docs.config.ts). Each test
 * seeds the sample dictionary in the format of its editor mode, opens the same item and saves the
 * viewport.
 */

const LANGUAGES: ReadonlyArray<SampleLanguage> = [
  { isoCode: "da-DK", name: "Danish (Denmark)" },
  { isoCode: "fr-FR", name: "French (France)" },
  { isoCode: "de-DE", name: "German (Germany)" },
];

/** The item every shot opens, in each language and each mode's format. */
const READ_MORE = {
  Rte: {
    "en-US":
      '<p><strong>Free delivery</strong> on orders over £50. Read our <a href="/delivery">delivery terms</a>.</p><ul><li><p>Next-day dispatch</p></li><li><p>30-day <em>free</em> returns</p></li></ul>',
    "da-DK":
      '<p><strong>Gratis levering</strong> ved køb over 400 kr. Læs vores <a href="/levering">leveringsbetingelser</a>.</p><ul><li><p>Afsendelse næste dag</p></li><li><p>30 dages <em>gratis</em> returnering</p></li></ul>',
    "fr-FR":
      '<p><strong>Livraison gratuite</strong> dès 50 €. Consultez nos <a href="/livraison">conditions de livraison</a>.</p><ul><li><p>Expédition le lendemain</p></li><li><p>Retours <em>gratuits</em> sous 30 jours</p></li></ul>',
    "de-DE":
      '<p><strong>Kostenloser Versand</strong> ab 50 €. Lesen Sie unsere <a href="/versand">Versandbedingungen</a>.</p><ul><li><p>Versand am nächsten Tag</p></li><li><p>30 Tage <em>kostenlose</em> Rücksendung</p></li></ul>',
  },
  Markdown: {
    "en-US":
      "**Free delivery** on orders over £50. Read our [delivery terms](/delivery).\n\n- Next-day dispatch\n- 30-day *free* returns",
    "da-DK":
      "**Gratis levering** ved køb over 400 kr. Læs vores [leveringsbetingelser](/levering).\n\n- Afsendelse næste dag\n- 30 dages *gratis* returnering",
    "fr-FR":
      "**Livraison gratuite** dès 50 €. Consultez nos [conditions de livraison](/livraison).\n\n- Expédition le lendemain\n- Retours *gratuits* sous 30 jours",
    "de-DE":
      "**Kostenloser Versand** ab 50 €. Lesen Sie unsere [Versandbedingungen](/versand).\n\n- Versand am nächsten Tag\n- 30 Tage *kostenlose* Rücksendung",
  },
} as const;

/** The rest of the sample tree: plain values, so they read the same in either mode. */
const TREE: ReadonlyArray<{ name: string; children: ReadonlyArray<string> }> = [
  { name: "Blog", children: ["Blog.ReadingTime"] },
  { name: "Common", children: ["Common.Close", "Common.ReadMore", "Common.Search", "Common.TermsNote"] },
  { name: "Footer", children: ["Footer.Address"] },
  { name: "Forms", children: ["Forms.Submit"] },
  { name: "Nav", children: ["Nav.Home"] },
];

/**
 * Seeds the languages and the sample tree, with Common.ReadMore in the given mode's format.
 *
 * @returns Common.ReadMore's key.
 */
async function seed(page: Page, mode: keyof typeof READ_MORE): Promise<string> {
  await ensureLanguages(page, LANGUAGES);
  let readMore = "";
  for (const branch of TREE) {
    const parent = await upsertItem(page, branch.name, {});
    for (const child of branch.children) {
      const values = child === "Common.ReadMore" ? READ_MORE[mode] : { "en-US": child.split(".")[1] ?? child };
      const id = await upsertItem(page, child, values, parent);
      if (child === "Common.ReadMore") readMore = id;
    }
  }
  return readMore;
}

/** Saves the viewport to `docs/images/{name}.png`, after the view has settled. */
async function shoot(page: Page, name: string): Promise<void> {
  // The workspace focuses the name field; a focus ring has no place in the docs.
  await page.evaluate(() => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    (active as HTMLElement | null)?.blur();
  });
  // Let transitions and late requests finish so a shot never catches a half-drawn view.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${repoRoot}docs/images/${name}.png` });
}

test("Rte mode", async ({ page }) => {
  const id = await seed(page, "Rte");
  // Tall enough for all four languages.
  await page.setViewportSize({ width: 1456, height: 1248 });

  await openItem(page, id);
  await expect(richTextField(page, "German (Germany)").locator("strong")).toHaveText("Kostenloser Versand");
  await shoot(page, "editor-rte");
});

test("Markdown mode", async ({ page }) => {
  await useEditorMode(page, "Markdown");
  const id = await seed(page, "Markdown");
  await page.setViewportSize({ width: 1440, height: 900 });

  await openItem(page, id);
  await expect(markdownLines(page)).toContainText("**Free delivery**");
  await shoot(page, "editor-markdown");

  // Leave the site's own (Rte) mode with values in its format.
  await seed(page, "Rte");
});
