import { expect, type Locator, type Page } from "@playwright/test";

/** The package's editor modes (the `RichDictionary:EditorMode` setting). */
export type EditorMode = "Rte" | "Markdown";

/** The sample sites' only language, the unattended install's default. */
export const ENGLISH = { isoCode: "en-US", label: "English (United States)" } as const;

const MANAGEMENT_API = "/umbraco/management/api/v1";

/**
 * The backoffice keeps its access token in an httpOnly cookie and sends this placeholder as the
 * bearer token; the Management API then reads the cookie. `page.request` shares the page's cookies,
 * so the same header authenticates the suite's own API calls.
 */
const AUTHORIZATION = { Authorization: "Bearer [redacted]" };

/**
 * Makes the client run in another editor mode than the site's (the sample sites run in Rte mode):
 * answers the package's configuration request with the site's own configuration and `mode`.
 * Switching the site itself would need a restart per mode; the server side of the setting is
 * covered by the package's unit tests and the package smoke test.
 *
 * @param page - The page, before it opens the backoffice.
 * @param mode - The mode the client should use.
 */
export async function useEditorMode(page: Page, mode: EditorMode): Promise<void> {
  await page.route("**/umbraco/umbracorichdictionary/api/v1/configuration", async (route) => {
    const response = await route.fetch();
    const configuration = (await response.json()) as Record<string, unknown>;
    await route.fulfill({ response, json: { ...configuration, editorMode: mode } });
  });
}

/** A unique dictionary item name, so tests never meet each other's items. */
export function uniqueName(prefix: string): string {
  return `E2E.${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Opens the workspace for a new dictionary item at the root and names it.
 *
 * @param page - A logged-in page.
 * @param name - The item name.
 */
export async function startNewItem(page: Page, name: string): Promise<void> {
  await page.goto("/umbraco/section/translation/workspace/dictionary/create/parent/dictionary-root/null");
  await page.getByRole("textbox", { name: "Enter a name..." }).fill(name);
}

/**
 * Opens an existing dictionary item.
 *
 * @param page - A logged-in page.
 * @param id - The item's key.
 */
export async function openItem(page: Page, id: string): Promise<void> {
  await page.goto(`/umbraco/section/translation/workspace/dictionary/edit/${id}`);
}

/**
 * The rich text (Tiptap) editor of one language.
 *
 * @param page - The page showing the dictionary item.
 * @param label - The language's name as the workspace shows it.
 */
export function richTextField(page: Page, label: string = ENGLISH.label): Locator {
  return page.getByRole("textbox", { name: label });
}

/**
 * The lines the first language's Markdown editor (the core `umb-input-markdown`, a Monaco code
 * editor) shows. Monaco lays them over its input, so clicking them is what focuses the editor.
 *
 * @param page - The page showing the dictionary item.
 */
export function markdownLines(page: Page): Locator {
  return page.locator("umb-input-markdown").first().locator(".view-lines");
}

/**
 * Saves the open item and returns the translations the backoffice sent, as stored.
 *
 * @param page - The page showing the dictionary item.
 * @returns The saved item's key and its translations by ISO code.
 */
export async function save(page: Page): Promise<{ id: string; translations: Record<string, string> }> {
  const request = page.waitForRequest(
    (r) =>
      /\/umbraco\/management\/api\/v1\/dictionary(\/[0-9a-f-]+)?$/.test(r.url()) &&
      ["POST", "PUT"].includes(r.method()),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const sent = await request;
  const response = await sent.response();
  expect(response?.ok(), `the dictionary save returned HTTP ${response?.status()}`).toBe(true);

  const body = sent.postDataJSON() as { translations: Array<{ isoCode: string; translation: string }> };
  // A new item moves to its edit route, which carries its key.
  await expect(page).toHaveURL(/\/workspace\/dictionary\/edit\/[0-9a-f-]+/);
  const id = /\/edit\/([0-9a-f-]+)/.exec(page.url())?.[1] ?? "";
  return { id, translations: Object.fromEntries(body.translations.map((t) => [t.isoCode, t.translation])) };
}

/** The Management API's shape of an item's values. */
function translationModels(translations: Record<string, string>): Array<{ isoCode: string; translation: string }> {
  return Object.entries(translations).map(([isoCode, translation]) => ({ isoCode, translation }));
}

/**
 * Creates a dictionary item through the Management API.
 *
 * @param page - A logged-in page (its cookies authenticate the request).
 * @param name - The item name, unique across the dictionary.
 * @param translations - The stored values by ISO code.
 * @param parentId - The parent item's key, or null for the root.
 * @returns The new item's key.
 */
export async function createItem(
  page: Page,
  name: string,
  translations: Record<string, string>,
  parentId: string | null = null,
): Promise<string> {
  const response = await page.request.post(`${MANAGEMENT_API}/dictionary`, {
    headers: AUTHORIZATION,
    data: { name, parent: parentId ? { id: parentId } : null, translations: translationModels(translations) },
  });
  expect(response.status(), await response.text()).toBe(201);
  // The response names the new item's URL; its last segment is the key.
  return (response.headers()["umb-generated-resource"] ?? "").split("/").pop() ?? "";
}

/**
 * Deletes a dictionary item through the Management API, so test items don't pile up on the sites.
 *
 * @param page - A logged-in page.
 * @param id - The item's key.
 */
export async function deleteItem(page: Page, id: string): Promise<void> {
  if (!id) return;
  await page.request.delete(`${MANAGEMENT_API}/dictionary/${id}`, { headers: AUTHORIZATION });
}

/** A language a site should have: its ISO code and the name the backoffice shows. */
export interface SampleLanguage {
  isoCode: string;
  name: string;
}

/**
 * Adds the languages a site does not have yet, through the Management API.
 *
 * @param page - A logged-in page.
 * @param languages - The languages the site should have.
 */
export async function ensureLanguages(page: Page, languages: ReadonlyArray<SampleLanguage>): Promise<void> {
  const response = await page.request.get(`${MANAGEMENT_API}/language?skip=0&take=100`, { headers: AUTHORIZATION });
  expect(response.status(), await response.text()).toBe(200);
  const existing = new Set(
    ((await response.json()) as { items: Array<{ isoCode: string }> }).items.map((l) => l.isoCode),
  );

  for (const language of languages.filter((l) => !existing.has(l.isoCode))) {
    const created = await page.request.post(`${MANAGEMENT_API}/language`, {
      headers: AUTHORIZATION,
      data: { ...language, isDefault: false, isMandatory: false },
    });
    expect(created.status(), await created.text()).toBe(201);
  }
}

/**
 * Creates a dictionary item, or updates the one with that name, through the Management API.
 *
 * @param page - A logged-in page.
 * @param name - The item name, unique across the dictionary.
 * @param translations - The stored values by ISO code.
 * @param parentId - The parent item's key, or null for the root.
 * @returns The item's key.
 */
export async function upsertItem(
  page: Page,
  name: string,
  translations: Record<string, string>,
  parentId: string | null = null,
): Promise<string> {
  const search = await page.request.get(
    `${MANAGEMENT_API}/dictionary?filter=${encodeURIComponent(name)}&skip=0&take=100`,
    {
      headers: AUTHORIZATION,
    },
  );
  expect(search.status(), await search.text()).toBe(200);
  const existing = ((await search.json()) as { items: Array<{ id: string; name?: string | null }> }).items.find(
    (item) => item.name === name,
  );
  if (!existing) return createItem(page, name, translations, parentId);

  const updated = await page.request.put(`${MANAGEMENT_API}/dictionary/${existing.id}`, {
    headers: AUTHORIZATION,
    data: { name, translations: translationModels(translations) },
  });
  expect(updated.status(), await updated.text()).toBe(200);
  return existing.id;
}
