using System.ComponentModel;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// Which editor the dictionary Edit view uses for dictionary values. An unrecognised configured value binds as
/// <see cref="Rte"/>, with a warning logged at startup.
/// </summary>
[TypeConverter(typeof(EditorModeConverter))]
public enum EditorMode
{
    /// <summary>Tiptap rich text editor; values are stored as HTML.</summary>
    Rte,

    /// <summary>Markdown editor; values are stored as Markdown.</summary>
    Markdown,
}

/// <summary>
/// Site-wide package settings, bound from the <c>RichDictionary</c> section of <c>appsettings.json</c>.
/// </summary>
public sealed class RichDictionaryOptions
{
    /// <summary>
    /// The editor used for dictionary values. Defaults to <see cref="EditorMode.Rte"/>.
    /// </summary>
    public EditorMode EditorMode { get; set; } = EditorMode.Rte;

    /// <summary>
    /// A rich text data type on the site whose Tiptap toolbar and extensions the dictionary editor
    /// uses in <see cref="EditorMode.Rte"/> mode, so the toolbar is designed in Umbraco's own data
    /// type editor. Either the data type's key (a GUID) or its name. Empty uses the package's
    /// built-in toolbar; so does a value that doesn't match a rich text data type.
    /// </summary>
    public string? RichTextDataType { get; set; }
}
