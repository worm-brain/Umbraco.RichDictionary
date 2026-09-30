import { css, customElement, html, nothing, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import { UmbPropertyEditorConfigCollection } from "@umbraco-cms/backoffice/property-editor";
import type { UmbInputTiptapElement } from "@umbraco-cms/backoffice/tiptap";
import type { EditorMode } from "../api/index.js";
import { detectForeignFormat } from "./format-mismatch.js";
import { toTiptapContent } from "./tiptap-content.js";

/**
 * Which editor a translation renders with. `Plain` is the stock textarea, used when the configured
 * mode can't be read, because it stores exactly what it shows.
 */
export type TranslationInputMode = EditorMode | "Plain";

// Dictionary values are short, inline copy, so the toolbar offers text formatting and links but
// none of the media, block, table or heading tools of the default Tiptap data type.
const RTE_CONFIGURATION = new UmbPropertyEditorConfigCollection([
  {
    alias: "extensions",
    value: [
      "Umb.Tiptap.Bold",
      "Umb.Tiptap.Italic",
      "Umb.Tiptap.Underline",
      "Umb.Tiptap.Strike",
      "Umb.Tiptap.Subscript",
      "Umb.Tiptap.Superscript",
      "Umb.Tiptap.BulletList",
      "Umb.Tiptap.OrderedList",
      "Umb.Tiptap.Link",
    ],
  },
  {
    alias: "toolbar",
    value: [
      [
        ["Umb.Tiptap.Toolbar.SourceEditor"],
        [
          "Umb.Tiptap.Toolbar.Bold",
          "Umb.Tiptap.Toolbar.Italic",
          "Umb.Tiptap.Toolbar.Underline",
          "Umb.Tiptap.Toolbar.Strike",
        ],
        ["Umb.Tiptap.Toolbar.Subscript", "Umb.Tiptap.Toolbar.Superscript"],
        ["Umb.Tiptap.Toolbar.BulletList", "Umb.Tiptap.Toolbar.OrderedList"],
        ["Umb.Tiptap.Toolbar.Link", "Umb.Tiptap.Toolbar.Unlink"],
        ["Umb.Tiptap.Toolbar.ClearFormatting"],
        ["Umb.Tiptap.Toolbar.Undo", "Umb.Tiptap.Toolbar.Redo"],
      ],
    ],
  },
]);

/**
 * Edits one language's translation with the configured editor. Dispatches `UmbChangeEvent` on
 * every user edit, with the new stored value in `value`; it never dispatches for the initial load,
 * so opening an item leaves the workspace clean.
 */
@customElement("rich-dictionary-translation-input")
export class RichDictionaryTranslationInputElement extends UmbLitElement {
  /** The editor to render. The matching core editor module is loaded the first time a mode is set. */
  @property()
  mode: TranslationInputMode = "Plain";

  /** The stored translation: HTML in `Rte` mode, Markdown in `Markdown` mode, text in `Plain` mode. */
  @property()
  value = "";

  @property()
  label = "";

  @property({ type: Boolean })
  readonly = false;

  // Tiptap reports an emptied editor as "<p></p>", which is stored as "". When that "" comes back
  // in as `value`, handing it to Tiptap would reset the editor and fire another update, looping.
  // So while `value` still equals what this element last emitted, Tiptap keeps its own HTML.
  #emitted?: { stored: string; editorHtml: string };

  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has("mode")) {
      // Lazy-load only the editor in use; both modules are core back-office code served by Umbraco.
      if (this.mode === "Rte") import("@umbraco-cms/backoffice/tiptap");
      if (this.mode === "Markdown") import("@umbraco-cms/backoffice/markdown-editor");
    }
  }

  #emit(stored: string, editorHtml = stored) {
    this.#emitted = { stored, editorHtml };
    this.value = stored;
    this.dispatchEvent(new UmbChangeEvent());
  }

  #onTiptapChange(event: Event) {
    const editor = event.target as UmbInputTiptapElement;
    this.#emit(editor.isEmpty() ? "" : editor.value, editor.value);
  }

  #onValueChange(event: Event) {
    this.#emit((event.target as HTMLInputElement).value ?? "");
  }

  #tiptapValue() {
    return this.#emitted?.stored === this.value ? this.#emitted.editorHtml : toTiptapContent(this.value);
  }

  override render() {
    return html`${this.#renderEditor()}${this.#renderForeignFormatNotice()}`;
  }

  // Informational only: the notice never touches the stored value, and converting it is left to the editor.
  #renderForeignFormatNotice() {
    const format = detectForeignFormat(this.value, this.mode);
    if (!format) return nothing;

    const message =
      format === "Markdown"
        ? "This value looks like Markdown, so the rich text editor shows its syntax as plain text. Check it before saving."
        : "This value looks like HTML from the rich text editor, so the Markdown editor shows its tags as text. Check it before saving.";
    return html`<p class="foreign-format" role="status">
      <uui-icon name="icon-alert"></uui-icon><span>${message}</span>
    </p>`;
  }

  #renderEditor() {
    switch (this.mode) {
      case "Rte":
        return html`<umb-input-tiptap
          .configuration=${RTE_CONFIGURATION}
          .value=${this.#tiptapValue()}
          .label=${this.label}
          ?readonly=${this.readonly}
          @change=${this.#onTiptapChange}
        ></umb-input-tiptap>`;
      case "Markdown":
        return html`<umb-input-markdown
          .value=${this.value}
          ?readonly=${this.readonly}
          @change=${this.#onValueChange}
        ></umb-input-markdown>`;
      default:
        return html`<uui-textarea
          label=${this.label}
          .value=${this.value}
          ?readonly=${this.readonly}
          @input=${this.#onValueChange}
        ></uui-textarea>`;
    }
  }

  static override readonly styles = [
    css`
      :host {
        display: block;
      }

      .foreign-format {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-2);
        margin: var(--uui-size-space-2) 0 0;
        color: var(--uui-color-warning-standalone);
        font-size: var(--uui-type-small-size);
      }
    `,
  ];
}

export default RichDictionaryTranslationInputElement;

declare global {
  interface HTMLElementTagNameMap {
    "rich-dictionary-translation-input": RichDictionaryTranslationInputElement;
  }
}
