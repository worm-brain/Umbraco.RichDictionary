// Component tests for <rich-dictionary-translation-input>, run in Chromium by `bun run test:browser`.
//
// These use the REAL core editors (`umb-input-tiptap`, `umb-input-markdown`), not stubs. The open
// question on issue #6 was whether `umb-input-tiptap` loads outside a running back-office. It does:
// it only needs the UUI library and the core Tiptap extension manifests in the extension registry,
// which src/browser-test-setup.ts provides. Testing against the real editor matters here, because
// the behaviour under test (no event on load, `<p></p>` stored as "", no update loop) depends on
// exactly how Tiptap reports content, which a stub would only restate.
//
// Markdown mode isn't covered. Its core editor (Monaco) throws from a resize callback once it has
// been removed from the page, which Vitest reports as an unhandled error that fails the run. It
// shares Plain mode's value/change handling, which is covered.
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { RichDictionaryTranslationInputElement, TranslationInputMode } from "./translation-input.element.js";
import "./translation-input.element.js";

/**
 * Renders a translation input the way the workspace view does, and records the stored value each
 * time it dispatches `change`.
 */
function renderInput(mode: TranslationInputMode, value: string) {
  const input = document.createElement("rich-dictionary-translation-input");
  input.mode = mode;
  input.value = value;
  input.label = "English";

  const changes: Array<string> = [];
  input.addEventListener("change", () => changes.push(input.value));

  document.body.append(input);
  return { input, changes, editor: page.getByRole("textbox", { name: "English" }) };
}

/** Lets pending Lit updates and editor transactions settle, so a feedback loop would show up. */
async function settle(input: RichDictionaryTranslationInputElement) {
  await input.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 100));
}

afterEach(() => document.body.replaceChildren());

describe("rich-dictionary-translation-input in Plain mode", () => {
  it("renders the stored value in a textarea", async () => {
    const { editor } = renderInput("Plain", "Read more");

    await expect.element(editor).toHaveValue("Read more");
  });

  it("does not dispatch change when a value is loaded", async () => {
    const { input, changes, editor } = renderInput("Plain", "Read more");
    await expect.element(editor).toHaveValue("Read more");

    await settle(input);

    expect(changes).toEqual([]);
  });

  it("dispatches change with the typed text as the stored value", async () => {
    const { changes, editor } = renderInput("Plain", "Read more");

    await editor.fill("Read less");

    expect(changes).toEqual(["Read less"]);
  });
});

describe("rich-dictionary-translation-input in Rte mode", () => {
  it("shows a plain-text legacy value as text, with its line breaks", async () => {
    const { editor } = renderInput("Rte", "Prices from < £10\nFree delivery");

    await expect.element(editor).toContainHTML("<p>Prices from &lt; £10<br>Free delivery</p>");
  });

  it("does not dispatch change when a value is loaded, even one converted from plain text", async () => {
    const { input, changes, editor } = renderInput("Rte", "Prices from < £10\nFree delivery");
    await expect.element(editor).toHaveTextContent("Free delivery");

    await settle(input);

    expect(changes).toEqual([]);
  });

  it("dispatches change with the editor's HTML as the stored value", async () => {
    const { changes, editor } = renderInput("Rte", "<p>Welcome</p>");
    await expect.element(editor).toHaveTextContent("Welcome");

    await editor.click();
    await userEvent.keyboard("{Control>}{End}{/Control}!");

    expect(changes).toEqual(["<p>Welcome!</p>"]);
  });

  it("stores a cleared editor as an empty string, dispatching change once", async () => {
    const { input, changes, editor } = renderInput("Rte", "<p>Welcome</p>");
    await expect.element(editor).toHaveTextContent("Welcome");

    await editor.click();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await settle(input);

    expect(changes).toEqual([""]);
  });

  it("keeps a cleared editor editable, so typing afterwards is stored", async () => {
    const { input, editor } = renderInput("Rte", "<p>Welcome</p>");
    await expect.element(editor).toHaveTextContent("Welcome");

    await editor.click();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await settle(input);
    await userEvent.keyboard("Hi");

    expect(input.value).toBe("<p>Hi</p>");
  });
});
