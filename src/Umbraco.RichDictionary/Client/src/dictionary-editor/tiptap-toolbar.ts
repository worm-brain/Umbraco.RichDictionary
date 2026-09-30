/** The two settings of a Tiptap rich text data type that the dictionary editor uses. */
export interface TiptapToolbarConfiguration {
  /** Tiptap extension aliases, e.g. `Umb.Tiptap.Bold`. */
  extensions: Array<string>;
  /** Toolbar rows, each a list of button groups, each a list of toolbar extension aliases. */
  toolbar: Array<Array<Array<string>>>;
}

/** The manifest type an alias must be registered as to be used in that part of the configuration. */
export type TiptapExtensionType = "tiptapExtension" | "tiptapToolbarExtension";

/** The parts of the package configuration that choose the toolbar. */
export interface ToolbarSource {
  /** `RichDictionary:RichTextDataType` as configured, or null/undefined when it is empty. */
  richTextDataType?: string | null;
  /** That data type's settings, or null/undefined when the server couldn't resolve it. */
  richTextEditor?: { extensions?: unknown; toolbar?: unknown } | null;
}

/**
 * The toolbar used when no data type is configured, or when the configured one can't be used.
 * Dictionary values are short, inline copy, so it offers text formatting and links but none of the
 * media, block, table or heading tools of the default Tiptap data type.
 */
export const DEFAULT_TIPTAP_CONFIGURATION: Readonly<TiptapToolbarConfiguration> = {
  extensions: [
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
  toolbar: [
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
};

/**
 * Extensions and toolbar items that are silently removed from a configured data type, because
 * media, blocks and embeds don't belong in dictionary values: a dictionary item has no media
 * tracking or block data to go with them. A site can point at its main rich text data type without
 * them showing up.
 */
export const EXCLUDED_TIPTAP_ALIASES: ReadonlySet<string> = new Set([
  "Umb.Tiptap.Block",
  "Umb.Tiptap.Embed",
  "Umb.Tiptap.Figure",
  "Umb.Tiptap.Image",
  "Umb.Tiptap.MediaUpload",
  "Umb.Tiptap.Toolbar.BlockPicker",
  "Umb.Tiptap.Toolbar.EmbeddedMedia",
  "Umb.Tiptap.Toolbar.MediaPicker",
]);

/**
 * Chooses the Tiptap extensions and toolbar for the dictionary editor from the package
 * configuration. It never throws and always returns a usable configuration: anything it can't use
 * is reported through `warn` and dropped, and if nothing usable is left it falls back to
 * {@link DEFAULT_TIPTAP_CONFIGURATION}.
 *
 * @param source - The package configuration, or `undefined` if it couldn't be read.
 * @param isRegistered - Whether an alias is registered in the back-office as the given manifest type.
 *   Aliases that aren't, e.g. a typo or an extension from an uninstalled package, are dropped.
 * @param warn - Receives a message for each problem, e.g. `console.warn`.
 */
export function resolveTiptapConfiguration(
  source: ToolbarSource | undefined,
  isRegistered: (alias: string, type: TiptapExtensionType) => boolean,
  warn: (message: string) => void,
): TiptapToolbarConfiguration {
  const fallback = () => structuredClone(DEFAULT_TIPTAP_CONFIGURATION) as TiptapToolbarConfiguration;
  const dataType = source?.richTextDataType;
  const editor = source?.richTextEditor;

  if (!editor) {
    if (dataType) {
      warn(`RichTextDataType "${dataType}" is not a rich text data type on this site; using the default toolbar.`);
    }
    return fallback();
  }
  if (!Array.isArray(editor.extensions) || !Array.isArray(editor.toolbar)) {
    warn(`RichTextDataType "${dataType}" has no Tiptap extensions and toolbar; using the default toolbar.`);
    return fallback();
  }

  const usable = (item: unknown, type: TiptapExtensionType): item is string => {
    if (typeof item !== "string") {
      warn(`Ignoring invalid ${type} ${JSON.stringify(item)} in RichTextDataType "${dataType}".`);
      return false;
    }
    if (EXCLUDED_TIPTAP_ALIASES.has(item)) return false;
    if (!isRegistered(item, type)) {
      warn(`Ignoring unknown ${type} "${item}" in RichTextDataType "${dataType}".`);
      return false;
    }
    return true;
  };

  const extensions = editor.extensions.filter((item): item is string => usable(item, "tiptapExtension"));
  const toolbar = editor.toolbar
    .map((row) =>
      (Array.isArray(row) ? row : [])
        .map((group) =>
          (Array.isArray(group) ? group : []).filter((item): item is string => usable(item, "tiptapToolbarExtension")),
        )
        .filter((group) => group.length > 0),
    )
    .filter((row) => row.length > 0);

  if (toolbar.length === 0) {
    warn(`RichTextDataType "${dataType}" leaves no usable toolbar buttons; using the default toolbar.`);
    return fallback();
  }
  return { extensions, toolbar };
}
