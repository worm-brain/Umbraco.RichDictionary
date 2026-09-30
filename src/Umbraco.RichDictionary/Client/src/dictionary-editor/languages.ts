/** The page size the Management API uses for `GET /language` when none is given. */
export const LANGUAGE_PAGE_SIZE = 100;

/**
 * The one method of the core `UmbLanguageCollectionRepository` this module uses. It exists on every
 * Umbraco 17.x, unlike `requestAllItems`, which only arrived in a later 17.x minor.
 */
export interface LanguageCollectionSource<T> {
  requestCollection(filter: { skip: number; take: number }): Promise<{
    data?: { items: Array<T>; total: number };
    error?: unknown;
  }>;
}

/**
 * Reads every language on the site, one page at a time, so a site with more languages than one page
 * holds still gets a field for each. Pages through `requestCollection` rather than calling the core
 * `requestAllItems`, which does the same but doesn't exist on Umbraco 17.0.
 *
 * @param source - The core language collection repository.
 * @param pageSize - Languages per request; defaults to the server's own page size.
 * @returns Every language, or `undefined` if a request failed, so the caller can keep what it has
 *   rather than show a partial list.
 */
export async function requestAllLanguages<T>(
  source: LanguageCollectionSource<T>,
  pageSize = LANGUAGE_PAGE_SIZE,
): Promise<Array<T> | undefined> {
  const languages: Array<T> = [];
  for (;;) {
    const { data, error } = await source.requestCollection({ skip: languages.length, take: pageSize });
    if (error || !data) return undefined;

    languages.push(...data.items);
    // An empty page ends it too, so a total that overstates the items can't loop forever.
    if (languages.length >= data.total || data.items.length === 0) return languages;
  }
}
