import { ConfigurationService, type ConfigurationResponseModel, type EditorMode } from "../api/index.js";

/** The subset of the generated client's response that the loader reads. */
type ConfigurationResult = {
  data?: { editorMode?: unknown } & Partial<Omit<ConfigurationResponseModel, "editorMode">>;
};

/** The package configuration, once its editor mode has been checked. */
export type RichDictionaryConfiguration = Omit<ConfigurationResponseModel, "editorMode"> & { editorMode: EditorMode };

const EDITOR_MODES: ReadonlyArray<unknown> = ["Rte", "Markdown"] satisfies Array<EditorMode>;

// The generated types say `EditorMode`, but only a string the client knows is trusted: an older
// server build serialised the enum as a number, which must fall back rather than be guessed at.
function isEditorMode(value: unknown): value is EditorMode {
  return EDITOR_MODES.includes(value);
}

/**
 * Builds a function that fetches the package configuration once and shares the answer with every
 * caller.
 *
 * The function resolves to `undefined` when the request errors or throws, or when the server sends
 * an editor mode this client doesn't recognise. A failure is not cached; the next call tries again.
 *
 * @param fetchConfiguration - Requests the package configuration from the server.
 */
export function createConfigurationLoader(
  fetchConfiguration: () => Promise<ConfigurationResult>,
): () => Promise<RichDictionaryConfiguration | undefined> {
  let pending: Promise<RichDictionaryConfiguration | undefined> | undefined;

  return () => {
    pending ??= fetchConfiguration()
      .then(({ data }) =>
        data && isEditorMode(data.editorMode) ? { ...data, editorMode: data.editorMode } : undefined,
      )
      .catch(() => undefined)
      .then((configuration) => {
        if (!configuration) pending = undefined;
        return configuration;
      });
    return pending;
  };
}

/**
 * The package configuration (the `RichDictionary` section of `appsettings.json`), fetched once per
 * back-office session. Resolves to `undefined` if it can't be read.
 */
export const getConfiguration = createConfigurationLoader(() => ConfigurationService.getConfiguration());

/**
 * The editor configured on the server (`RichDictionary:EditorMode`).
 *
 * Resolves to `undefined` if it can't be read. Callers must then fall back to a plain textarea, so
 * that a failed request can never re-save stored values in the wrong format.
 */
export const getEditorMode = async (): Promise<EditorMode | undefined> => (await getConfiguration())?.editorMode;
