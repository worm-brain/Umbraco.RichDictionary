import { describe, expect, it, vi } from "vitest";

type CurrentUser = { getHasAccessToAllLanguages(): boolean | undefined; getLanguages(): Array<string> | undefined };

// A stand-in for the core repository: it records what would be sent to the server, and hands out
// whatever current user the test puts on the host. The real one pulls in the whole back-office.
vi.mock("@umbraco-cms/backoffice/dictionary", () => ({
  UmbDictionaryDetailRepository: class {
    constructor(private readonly host: { currentUser?: CurrentUser; saved: Array<unknown> }) {}
    getContext() {
      return Promise.resolve(this.host.currentUser);
    }
    save(model: unknown) {
      this.host.saved.push(model);
      return Promise.resolve({ data: model });
    }
  },
}));
vi.mock("@umbraco-cms/backoffice/current-user", () => ({ UMB_CURRENT_USER_CONTEXT: "UMB_CURRENT_USER_CONTEXT" }));

const { RichDictionaryDetailRepository } = await import("./dictionary-detail.repository.js");

const item = {
  entityType: "dictionary-item",
  unique: "53a3f80d-b2c8-a13d-72ae-b9368609e28a",
  name: "Common.ReadMore",
  translations: [
    { isoCode: "en-US", translation: "<p>Read more now</p>" },
    { isoCode: "da-DK", translation: "Læs mere" },
  ],
};

/** Saves `item` through the repository as the given user, and returns what reached the core save. */
async function saveAs(currentUser: CurrentUser | undefined) {
  const host = { currentUser, saved: [] as Array<unknown> };
  const repository = new RichDictionaryDetailRepository(host as never);

  await repository.save(item as never);

  return host.saved[0];
}

describe("RichDictionaryDetailRepository.save", () => {
  it("sends only the languages a restricted user may edit", async () => {
    const saved = await saveAs({ getHasAccessToAllLanguages: () => false, getLanguages: () => ["en-US"] });

    expect(saved).toEqual({ ...item, translations: [{ isoCode: "en-US", translation: "<p>Read more now</p>" }] });
  });

  it("sends every language for a user with access to all languages", async () => {
    const saved = await saveAs({ getHasAccessToAllLanguages: () => true, getLanguages: () => [] });

    expect(saved).toEqual(item);
  });

  it("sends every language, as core does, when the current user can't be read", async () => {
    const saved = await saveAs(undefined);

    expect(saved).toEqual(item);
  });
});
