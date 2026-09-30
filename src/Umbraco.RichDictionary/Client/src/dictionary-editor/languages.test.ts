import { describe, expect, it, vi } from "vitest";
import { requestAllLanguages, type LanguageCollectionSource } from "./languages.js";

/** A language repository over a fixed list, answering each page the way the Management API does. */
function repositoryOf(languages: Array<string>): LanguageCollectionSource<string> {
  return {
    requestCollection: vi.fn(async ({ skip, take }) => ({
      data: { items: languages.slice(skip, skip + take), total: languages.length },
    })),
  };
}

describe("requestAllLanguages", () => {
  it("returns every language when they fit on one page", async () => {
    const languages = await requestAllLanguages(repositoryOf(["en-US", "da-DK"]));

    expect(languages).toEqual(["en-US", "da-DK"]);
  });

  it("pages through the collection until it has every language", async () => {
    const languages = await requestAllLanguages(repositoryOf(["en-US", "da-DK", "de-DE", "fr-FR", "nl-NL"]), 2);

    expect(languages).toEqual(["en-US", "da-DK", "de-DE", "fr-FR", "nl-NL"]);
  });

  it("returns undefined when a request fails, rather than a partial list", async () => {
    const source: LanguageCollectionSource<string> = {
      requestCollection: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: ["en-US"], total: 2 } })
        .mockResolvedValueOnce({ error: new Error("Forbidden") }),
    };

    expect(await requestAllLanguages(source, 1)).toBeUndefined();
  });

  it("stops at an empty page even when the total says there are more", async () => {
    const source: LanguageCollectionSource<string> = {
      requestCollection: vi.fn(async ({ skip }) => ({ data: { items: skip === 0 ? ["en-US"] : [], total: 5 } })),
    };

    expect(await requestAllLanguages(source, 1)).toEqual(["en-US"]);
  });
});
