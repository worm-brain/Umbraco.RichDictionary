import { describe, expect, it } from "vitest";
import { canEditLanguage, editableTranslations } from "./language-access.js";

const englishOnly = { hasAccessToAllLanguages: false, languages: ["en-US"] };
const allLanguages = { hasAccessToAllLanguages: true, languages: [] };

describe("canEditLanguage", () => {
  it("allows a language the user's groups grant", () => {
    expect(canEditLanguage("en-US", englishOnly)).toBe(true);
  });

  it("refuses a language the user's groups don't grant", () => {
    expect(canEditLanguage("da-DK", englishOnly)).toBe(false);
  });

  it("allows any language when the user has access to all languages", () => {
    expect(canEditLanguage("da-DK", allLanguages)).toBe(true);
  });

  it("refuses every language when the user has no language access", () => {
    expect(canEditLanguage("en-US", { hasAccessToAllLanguages: false, languages: [] })).toBe(false);
  });
});

describe("editableTranslations", () => {
  const translations = [
    { isoCode: "en-US", translation: "Read more" },
    { isoCode: "da-DK", translation: "Læs mere" },
    { isoCode: "de-DE", translation: "Weiterlesen" },
  ];

  it("keeps only the languages the user may edit", () => {
    expect(editableTranslations(translations, englishOnly)).toEqual([{ isoCode: "en-US", translation: "Read more" }]);
  });

  it("keeps every translation when the user has access to all languages", () => {
    expect(editableTranslations(translations, allLanguages)).toEqual(translations);
  });
});
