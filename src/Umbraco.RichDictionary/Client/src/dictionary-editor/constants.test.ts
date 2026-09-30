import { describe, expect, it } from "vitest";
import { CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS, CORE_DICTIONARY_EDIT_VIEW_ALIAS } from "./constants.js";

// The installed back-office's own dictionary package registration, the list of manifests Umbraco
// registers for the Translation section. The package's `exports` map doesn't expose it, so it is
// imported by file path. If an upgrade moves this file, the import fails and these tests go red,
// which is the right prompt to re-check the aliases by hand.
const CORE_DICTIONARY_PACKAGE =
  "../../node_modules/@umbraco-cms/backoffice/dist-cms/packages/dictionary/umbraco-package.js";

// Every core extension the package replaces or excludes by alias. If Umbraco renames one, the
// package silently stops replacing it, so each must still be registered with the type we expect.
describe.each([
  { constant: "CORE_DICTIONARY_EDIT_VIEW_ALIAS", alias: CORE_DICTIONARY_EDIT_VIEW_ALIAS, type: "workspaceView" },
  {
    constant: "CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS",
    alias: CORE_DICTIONARY_DETAIL_REPOSITORY_ALIAS,
    type: "repository",
  },
])("$constant", ({ constant, alias, type }) => {
  it(`matches a ${type} the installed back-office registers`, async () => {
    const { manifests }: { manifests: Array<UmbExtensionManifest> } = await import(
      /* @vite-ignore */ CORE_DICTIONARY_PACKAGE
    );

    const coreAliases = manifests.filter((m) => m.type === type).map((m) => m.alias);

    expect(
      coreAliases,
      `@umbraco-cms/backoffice no longer registers a ${type} with the alias "${alias}", so the package ` +
        "no longer replaces it and the core one would be used. Find its new alias among the aliases listed " +
        `after this message and update ${constant} in src/dictionary-editor/constants.ts.`,
    ).toContain(alias);
  });
});
