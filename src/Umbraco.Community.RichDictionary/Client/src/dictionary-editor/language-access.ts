/**
 * What the current back-office user's groups grant over languages: every language, or only the ISO
 * codes in `languages`. The shape of `UMB_CURRENT_USER_CONTEXT`'s `hasAccessToAllLanguages` and
 * `languages`.
 */
export interface LanguageAccess {
  hasAccessToAllLanguages: boolean;
  languages: ReadonlyArray<string>;
}

/**
 * The core rule for whether a user may edit a language's translation, shared by the edit view (which
 * shows the other languages read-only) and the save (which sends only these languages).
 *
 * @param isoCode - The language's ISO code, e.g. `en-US`.
 * @param access - The current user's language access.
 * @returns `true` when the user's groups grant every language or this one.
 */
export function canEditLanguage(isoCode: string, access: LanguageAccess): boolean {
  return access.hasAccessToAllLanguages || access.languages.includes(isoCode);
}

/**
 * Keeps only the translations the user may edit. The Management API forbids a dictionary update
 * whose body names any language the user can't edit, even with an unchanged value, and keeps the
 * stored value of every language the body leaves out. So sending only the editable languages saves
 * the user's changes and leaves the others untouched.
 *
 * @param translations - Every translation in the workspace's dictionary item.
 * @param access - The current user's language access.
 * @returns The translations for languages the user may edit, in their original order.
 */
export function editableTranslations<T extends { isoCode: string }>(
  translations: ReadonlyArray<T>,
  access: LanguageAccess,
): Array<T> {
  return translations.filter((translation) => canEditLanguage(translation.isoCode, access));
}
