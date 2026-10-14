import { containsHtmlMarkup } from "./tiptap-content.js";

/** The format a stored value appears to have been saved in, when that isn't the configured mode's. */
export type ForeignFormat = "Markdown" | "Html";

// Each pattern is Markdown syntax that plain text is unlikely to contain by accident. A lone `*`,
// `_` or `#` is deliberately not enough: "5 * 3", "Terms apply*" and "#1 choice" are ordinary text.
// Lists and `*italic*` are left out for the same reason: plain text uses "- " lines and asterisks.
const MARKDOWN_SYNTAX = [
  // **bold** or __bold__, with no space just inside the markers.
  /(\*\*|__)(?=\S)[^\n]*?\S\1/,
  // [text](target)
  /\[[^\]\n]+\]\([^)\s]+\)/,
  // An ATX heading at the start of a line: "# Title" to "###### Title".
  /^#{1,6} +\S/m,
];

// What the Tiptap editor stores: the whole value wrapped in block elements, e.g. "<p>...</p>".
// Inline HTML inside Markdown ("Water is H<sub>2</sub>O") is valid Markdown, so it doesn't count.
const RTE_HTML = /^<(p|h[1-6]|ul|ol|blockquote|div)\b[^<>]*>[\s\S]*<\/(p|h[1-6]|ul|ol|blockquote|div)>$/i;

/**
 * Detects a stored value that looks like it was saved in the other editor mode's format, which
 * happens when a site changes `RichDictionary:EditorMode` after values were saved. The heuristics
 * are conservative: they only fire on syntax that plain text is unlikely to contain, so a false
 * notice is rarer than a missed one.
 *
 * @param value - The stored translation.
 * @param mode - The editor mode in use. Only `Rte` and `Markdown` have an "other" format.
 * @returns `"Markdown"` for Markdown syntax in `Rte` mode, `"Html"` for rich text editor HTML in
 *   `Markdown` mode, otherwise `undefined`.
 */
export function detectForeignFormat(value: string, mode: string): ForeignFormat | undefined {
  if (mode === "Rte" && !containsHtmlMarkup(value) && MARKDOWN_SYNTAX.some((syntax) => syntax.test(value))) {
    return "Markdown";
  }
  if (mode === "Markdown" && RTE_HTML.test(value.trim())) return "Html";
  return undefined;
}
