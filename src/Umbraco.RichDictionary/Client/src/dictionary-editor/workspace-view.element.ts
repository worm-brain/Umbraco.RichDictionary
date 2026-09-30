import { css, customElement, html, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DICTIONARY_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/dictionary";
import { UmbLanguageCollectionRepository, type UmbLanguageDetailModel } from "@umbraco-cms/backoffice/language";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import { getEditorMode } from "../configuration/editor-mode.js";
import { canEditLanguage } from "./language-access.js";
import type { RichDictionaryTranslationInputElement, TranslationInputMode } from "./translation-input.element.js";
import "./translation-input.element.js";

type DictionaryWorkspaceContext = typeof UMB_DICTIONARY_WORKSPACE_CONTEXT.TYPE;
type DictionaryModel = NonNullable<ReturnType<DictionaryWorkspaceContext["getData"]>>;

/**
 * Replaces the core dictionary "Edit" workspace view (`Umb.WorkspaceView.Dictionary.Edit`). It has
 * the same layout, one field per language, and the same rule that a user can edit only the
 * languages their user groups grant. Each field is a rich editor instead of a textarea.
 */
@customElement("rich-dictionary-workspace-view")
export class RichDictionaryWorkspaceViewElement extends UmbLitElement {
  @state()
  private _dictionary?: DictionaryModel;

  @state()
  private _languages: Array<UmbLanguageDetailModel> = [];

  @state()
  private _mode?: TranslationInputMode;

  @state()
  private _currentUserLanguageAccess?: Array<string>;

  @state()
  private _currentUserHasAccessToAllLanguages = false;

  @state()
  private _hasCurrentUser = false;

  #workspaceContext?: DictionaryWorkspaceContext;
  #languageCollectionRepository = new UmbLanguageCollectionRepository(this);

  constructor() {
    super();

    this.consumeContext(UMB_DICTIONARY_WORKSPACE_CONTEXT, (context) => {
      this.#workspaceContext = context;
      this.observe(context?.dictionary, (dictionary) => (this._dictionary = dictionary));
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      this._hasCurrentUser = !!context;
      this.observe(context?.languages, (languages) => (this._currentUserLanguageAccess = languages));
      this.observe(
        context?.hasAccessToAllLanguages,
        (hasAccess) => (this._currentUserHasAccessToAllLanguages = hasAccess ?? false),
      );
    });

    getEditorMode().then((mode) => {
      if (!mode) console.warn("[Umbraco.RichDictionary] Could not read the editor mode; showing plain text fields.");
      this._mode = mode ?? "Plain";
    });
  }

  override async firstUpdated() {
    const { data } = await this.#languageCollectionRepository.requestAllItems();
    if (data) this._languages = data.items;
  }

  // Read-only until the current user has loaded, then only for languages the user can't access.
  #isReadOnly(isoCode: string) {
    if (!this._hasCurrentUser) return true;
    return !canEditLanguage(isoCode, {
      hasAccessToAllLanguages: this._currentUserHasAccessToAllLanguages,
      languages: this._currentUserLanguageAccess ?? [],
    });
  }

  #onChange(isoCode: string, event: Event) {
    const input = event.target as RichDictionaryTranslationInputElement;
    this.#workspaceContext?.setPropertyValue(isoCode, input.value);
  }

  override render() {
    return html`
      <uui-box>
        <umb-localize key="dictionaryItem_description" .args=${[this._dictionary?.name ?? "..."]}></umb-localize>
        ${
          this._mode
            ? repeat(
                this._languages,
                (language) => language.unique,
                (language) => this.#renderTranslation(language, this._mode!),
              )
            : html`<uui-loader></uui-loader>`
        }
      </uui-box>
    `;
  }

  #renderTranslation(language: UmbLanguageDetailModel, mode: TranslationInputMode) {
    const isoCode = language.unique;
    const translation = this._dictionary?.translations?.find((x) => x.isoCode === isoCode);
    const label = language.name ?? isoCode;

    return html`<umb-property-layout label=${label}>
      <rich-dictionary-translation-input
        slot="editor"
        .mode=${mode}
        .value=${translation?.translation ?? ""}
        .label=${label}
        ?readonly=${this.#isReadOnly(isoCode)}
        @change=${(event: Event) => this.#onChange(isoCode, event)}
      ></rich-dictionary-translation-input>
    </umb-property-layout>`;
  }

  static override readonly styles = [
    css`
      :host {
        display: block;
        padding: var(--uui-size-space-6);
      }
    `,
  ];
}

export default RichDictionaryWorkspaceViewElement;

declare global {
  interface HTMLElementTagNameMap {
    "rich-dictionary-workspace-view": RichDictionaryWorkspaceViewElement;
  }
}
