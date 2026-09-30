import { describe, expect, it } from "vitest";
import { CORE_DICTIONARY_EDIT_VIEW_ALIAS } from "./constants.js";

// The installed back-office's own dictionary package registration, the list of manifests Umbraco
// registers for the Translation section. The package's `exports` map doesn't expose it, so it is
// imported by file path. If an upgrade moves this file, the import fails and this test goes red,
// which is the right prompt to re-check the alias by hand.
const CORE_DICTIONARY_PACKAGE =
  "../../node_modules/@umbraco-cms/backoffice/dist-cms/packages/dictionary/umbraco-package.js";

describe("CORE_DICTIONARY_EDIT_VIEW_ALIAS", () => {
  it("matches a workspace view the installed back-office registers", async () => {
    const { manifests }: { manifests: Array<UmbExtensionManifest> } = await import(
      /* @vite-ignore */ CORE_DICTIONARY_PACKAGE
    );

    const coreWorkspaceViewAliases = manifests.filter((m) => m.type === "workspaceView").map((m) => m.alias);

    expect(
      coreWorkspaceViewAliases,
      `@umbraco-cms/backoffice no longer registers a workspace view with the alias "${CORE_DICTIONARY_EDIT_VIEW_ALIAS}", ` +
        "so the entry point's exclusion does nothing and both dictionary editors would render. " +
        "Find the core dictionary edit view's new alias among the aliases listed after this message and update " +
        "CORE_DICTIONARY_EDIT_VIEW_ALIAS in src/dictionary-editor/constants.ts.",
    ).toContain(CORE_DICTIONARY_EDIT_VIEW_ALIAS);
  });
});
