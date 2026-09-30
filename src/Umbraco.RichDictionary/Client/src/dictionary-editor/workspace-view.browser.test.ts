// Component tests for <rich-dictionary-workspace-view>, run in Chromium by `bun run test:browser`.
//
// The view gets everything from outside: the dictionary item and its writes from the core dictionary
// workspace context, the user's language access from the current-user context, the languages from
// the core Management API, and the editor mode from our configuration endpoint. The tests provide
// the two contexts from a host element (as the back-office does) using small fakes, answer the
// Management API's language request with a stubbed `fetch`, and replace the editor-mode loader,
// which caches its answer for the session and so couldn't vary per test behind a stubbed `fetch`.
// (Vitest browser mode can't `vi.mock` the core language module, which is served unbundled.)
// The translation inputs inside are real, including the core Tiptap editor.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { UMB_DICTIONARY_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/dictionary";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import { html } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbArrayState, UmbBooleanState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import type { EditorMode } from "../api/index.js";

type Translation = { isoCode: string; translation: string };

const editorMode = vi.hoisted(() => ({ current: undefined as EditorMode | undefined }));
vi.mock("../configuration/editor-mode.js", () => ({ getEditorMode: async () => editorMode.current }));

/** Answers the core Management API's language collection request with two languages. */
async function fakeManagementApi(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString(), location.href);
  if (url.pathname !== "/umbraco/management/api/v1/language") return new Response(null, { status: 404 });

  return Response.json({
    total: 2,
    items: [
      { isoCode: "en-GB", name: "English (United Kingdom)", isDefault: true, isMandatory: false },
      { isoCode: "da-DK", name: "Danish", isDefault: false, isMandatory: false },
    ],
  });
}

/**
 * Stands in for the core dictionary workspace context: holds the item being edited, and applies
 * `setPropertyValue` to it the way the core context does, so written values flow back into the view.
 */
class FakeDictionaryWorkspaceContext {
  readonly writes: Array<Translation> = [];
  #dictionary: UmbObjectState<{ name: string; translations: Array<Translation> }>;
  readonly dictionary;

  constructor(
    private readonly host: Element,
    translations: Array<Translation>,
  ) {
    this.#dictionary = new UmbObjectState({ name: "Welcome", translations });
    this.dictionary = this.#dictionary.asObservable();
  }

  // The context API asks every context for the element providing it.
  getHostElement() {
    return this.host;
  }

  getEntityType() {
    return "dictionary";
  }

  setPropertyValue(isoCode: string, translation: string) {
    this.writes.push({ isoCode, translation });
    const translations = this.#dictionary
      .getValue()
      .translations.map((x) => (x.isoCode === isoCode ? { isoCode, translation } : x));
    this.#dictionary.update({ translations });
  }
}

/** Stands in for the core current-user context: which languages the user may edit. */
function currentUserContext(host: Element, access: { languages: Array<string>; all: boolean }) {
  return {
    getHostElement: () => host,
    languages: new UmbArrayState(access.languages, (x) => x).asObservable(),
    hasAccessToAllLanguages: new UmbBooleanState(access.all).asObservable(),
  };
}

/** Provides contexts to the view slotted inside it, like the core workspace element does. */
class TestWorkspaceHostElement extends UmbLitElement {
  override render() {
    return html`<slot></slot>`;
  }
}
customElements.define("test-workspace-host", TestWorkspaceHostElement);

/** Renders the view inside a host that provides the workspace and current-user contexts. */
async function renderView(options: {
  mode: EditorMode | undefined;
  translations: Array<Translation>;
  access?: { languages: Array<string>; all: boolean };
}) {
  editorMode.current = options.mode;
  const host = new TestWorkspaceHostElement();
  const workspace = new FakeDictionaryWorkspaceContext(host, options.translations);
  const access = options.access ?? { languages: [], all: true };
  host.provideContext(UMB_DICTIONARY_WORKSPACE_CONTEXT, workspace as never);
  host.provideContext(UMB_CURRENT_USER_CONTEXT, currentUserContext(host, access) as never);

  // Imported here, after the mocks above are in place.
  await import("./workspace-view.element.js");
  host.append(document.createElement("rich-dictionary-workspace-view"));
  document.body.append(host);

  return {
    workspace,
    english: page.getByRole("textbox", { name: "English (United Kingdom)" }),
    danish: page.getByRole("textbox", { name: "Danish" }),
  };
}

/** Lets pending Lit updates and editor transactions settle, so a feedback loop would show up. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

beforeEach(() => {
  vi.stubGlobal("fetch", fakeManagementApi);
  // The view warns when it falls back to plain text fields, which most tests use.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rich-dictionary-workspace-view", () => {
  it("renders a plain text field per language, showing its stored translation, when the mode can't be read", async () => {
    const { english, danish } = await renderView({
      mode: undefined,
      translations: [
        { isoCode: "en-GB", translation: "Hello" },
        { isoCode: "da-DK", translation: "Hej" },
      ],
    });

    await expect.element(english).toHaveValue("Hello");
    await expect.element(danish).toHaveValue("Hej");
  });

  it("writes a user's edit through the workspace context", async () => {
    const { workspace, danish } = await renderView({
      mode: undefined,
      translations: [{ isoCode: "da-DK", translation: "Hej" }],
    });

    await danish.fill("Hej med dig");

    expect(workspace.writes).toEqual([{ isoCode: "da-DK", translation: "Hej med dig" }]);
  });

  it("makes languages the user has no access to read-only", async () => {
    const { danish } = await renderView({
      mode: undefined,
      translations: [],
      access: { languages: ["en-GB"], all: false },
    });

    await expect.element(danish).toHaveAttribute("readonly");
  });

  it("leaves languages the user has access to editable", async () => {
    const { english } = await renderView({
      mode: undefined,
      translations: [{ isoCode: "en-GB", translation: "Hello" }],
      access: { languages: ["en-GB"], all: false },
    });
    await expect.element(english).toHaveValue("Hello");

    await expect.element(english).not.toHaveAttribute("readonly");
  });

  it("does not write anything when an item with plain-text values opens in the rich editor", async () => {
    const { workspace, english } = await renderView({
      mode: "Rte",
      translations: [{ isoCode: "en-GB", translation: "Prices from < £10\nFree delivery" }],
    });
    await expect.element(english).toHaveTextContent("Free delivery");

    await settle();

    expect(workspace.writes).toEqual([]);
  });

  it("writes a cleared rich field as an empty string, once", async () => {
    const { workspace, english } = await renderView({
      mode: "Rte",
      translations: [{ isoCode: "en-GB", translation: "<p>Welcome</p>" }],
    });
    await expect.element(english).toHaveTextContent("Welcome");

    await english.click();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await settle();

    expect(workspace.writes).toEqual([{ isoCode: "en-GB", translation: "" }]);
  });
});
