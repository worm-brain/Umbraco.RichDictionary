// An opening/closing/self-closing tag, or a character reference such as `&copy;` or `&#169;`.
// A bare `<` or `&` followed by a space (e.g. "Prices < 10 & up") matches neither.
const HTML_MARKUP = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i;

/**
 * Prepares a stored dictionary value for the Tiptap editor, which parses its content as HTML.
 *
 * A value that already contains HTML markup, such as one saved by this editor or typed as raw HTML
 * into the stock textarea, is passed through unchanged. Anything else is treated as the plain text
 * the stock textarea stores: it is HTML-escaped, blank lines become paragraphs, and single line
 * breaks become `<br>`. Without this, `a < b` would be parsed as a tag and line breaks would collapse.
 *
 * @param value - The stored translation. An empty string stays empty.
 * @returns HTML for the editor's initial content.
 */
export function toTiptapContent(value: string): string {
  if (!value || HTML_MARKUP.test(value)) return value;

  return value
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
