using System.ComponentModel;
using System.Globalization;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// Converts a configured <c>RichDictionary:EditorMode</c> string to an <see cref="EditorMode"/>, turning an
/// unrecognised value into <see cref="EditorMode.Rte"/> instead of throwing.
/// </summary>
/// <remarks>
/// The configuration binder picks this up through the <see cref="TypeConverterAttribute"/> on
/// <see cref="EditorMode"/>. With the default enum converter, a typo such as <c>"Nonsense"</c> makes every read of
/// <see cref="RichDictionaryOptions"/> throw, which surfaces as a failing back-office request or a broken page
/// rather than at startup. <see cref="EditorModeStartupCheck"/> logs the typo instead.
/// </remarks>
internal sealed class EditorModeConverter : EnumConverter
{
    /// <summary>
    /// Creates the converter. Public and parameterless because <see cref="TypeDescriptor"/> instantiates it.
    /// </summary>
    public EditorModeConverter()
        : base(typeof(EditorMode)) { }

    /// <summary>
    /// Converts a string with <see cref="TryParse"/>, falling back to <see cref="EditorMode.Rte"/> for anything it
    /// does not recognise. Other value types go to the default enum conversion.
    /// </summary>
    /// <param name="context">The type descriptor context.</param>
    /// <param name="culture">The culture; ignored for strings, because mode names are culture-invariant.</param>
    /// <param name="value">The value to convert.</param>
    /// <returns>The <see cref="EditorMode"/>.</returns>
    public override object? ConvertFrom(
        ITypeDescriptorContext? context,
        CultureInfo? culture,
        object value
    ) =>
        value is string text
            ? TryParse(text, out var mode)
                ? mode
                : EditorMode.Rte
            : base.ConvertFrom(context, culture, value);

    /// <summary>
    /// Parses an editor mode by name, ignoring case and surrounding whitespace. Unlike <see cref="Enum.TryParse{TEnum}(string?, bool, out TEnum)"/>,
    /// numbers such as <c>"1"</c> are rejected, because the settings schema documents names only.
    /// </summary>
    /// <param name="value">The configured value.</param>
    /// <param name="mode">The parsed mode, or <see cref="EditorMode.Rte"/> when the value is not recognised.</param>
    /// <returns><see langword="true"/> when <paramref name="value"/> names an <see cref="EditorMode"/>.</returns>
    public static bool TryParse(string? value, out EditorMode mode)
    {
        foreach (var candidate in Enum.GetValues<EditorMode>())
        {
            if (
                string.Equals(
                    candidate.ToString(),
                    value?.Trim(),
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                mode = candidate;
                return true;
            }
        }

        mode = EditorMode.Rte;
        return false;
    }
}
