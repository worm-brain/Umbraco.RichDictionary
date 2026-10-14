import { UmbDictionaryDetailRepository } from "@umbraco-cms/backoffice/dictionary";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import { editableTranslations } from "./language-access.js";

type DictionaryDetailModel = Parameters<UmbDictionaryDetailRepository["save"]>[0];

/**
 * The core dictionary detail repository, except that saving an existing item sends only the
 * translations the current user may edit.
 *
 * The core workspace saves every translation of the item, and the Management API rejects the whole
 * update when it names a language the user can't edit, so a user without access to every language
 * could never save. The API keeps the stored value of any language the update leaves out, so the
 * read-only languages stay exactly as they are. Registered in place of the core repository under the
 * same alias (see the entry point), so the core workspace uses it without knowing.
 */
export class RichDictionaryDetailRepository extends UmbDictionaryDetailRepository {
  /**
   * Saves an existing dictionary item, sending only the translations the current user may edit.
   * When the current user can't be read, it sends every translation, as the core repository does,
   * so the server still decides and a refused save is reported rather than silently dropped.
   *
   * @param model - The dictionary item as edited in the workspace.
   * @returns The core repository's response: the item as saved, or the error.
   */
  override async save(model: DictionaryDetailModel) {
    const currentUser = await this.getContext(UMB_CURRENT_USER_CONTEXT).catch(() => undefined);
    const hasAccessToAllLanguages = currentUser?.getHasAccessToAllLanguages();
    const languages = currentUser?.getLanguages();
    if (hasAccessToAllLanguages === undefined || languages === undefined) return super.save(model);

    return super.save({
      ...model,
      translations: editableTranslations(model.translations, { hasAccessToAllLanguages, languages }),
    });
  }
}

export { RichDictionaryDetailRepository as api };
