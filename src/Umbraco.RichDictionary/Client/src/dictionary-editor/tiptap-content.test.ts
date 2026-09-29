import { describe, expect, it } from "vitest";
import { toTiptapContent } from "./tiptap-content.js";

describe("toTiptapContent", () => {
  it.each([
    ["a formatted value", '<p>Sign up to our <a href="/newsletter">newsletter</a>.</p>'],
    ["inline tags without a wrapping paragraph", "&copy; 2026 <strong>Acme Ltd</strong>."],
    ["a self-closing tag", "Line one<br/>Line two"],
    ["a named character reference only", "Caf&eacute;"],
    ["a numeric character reference only", "&#169; 2026"],
  ])("passes %s through unchanged", (_case, value) => {
    expect(toTiptapContent(value)).toBe(value);
  });

  it("leaves an empty value empty", () => {
    expect(toTiptapContent("")).toBe("");
  });

  it("wraps a single line of plain text in a paragraph", () => {
    expect(toTiptapContent("Read more")).toBe("<p>Read more</p>");
  });

  it("escapes characters that plain text did not mean as markup", () => {
    expect(toTiptapContent("Prices from < £10 & free > £50")).toBe("<p>Prices from &lt; £10 &amp; free &gt; £50</p>");
  });

  it("escapes text that looks like a tag but has no closing bracket", () => {
    expect(toTiptapContent("if a<b then")).toBe("<p>if a&lt;b then</p>");
  });

  it("turns single line breaks into <br>", () => {
    expect(toTiptapContent("Acme Ltd\n1 High Street\nLondon")).toBe("<p>Acme Ltd<br>1 High Street<br>London</p>");
  });

  it("turns blank lines into separate paragraphs", () => {
    expect(toTiptapContent("No posts yet.\n\nCheck back soon!")).toBe("<p>No posts yet.</p><p>Check back soon!</p>");
  });

  it("treats Windows line endings like \\n", () => {
    expect(toTiptapContent("One\r\nTwo\r\n\r\nThree")).toBe("<p>One<br>Two</p><p>Three</p>");
  });

  it("keeps Markdown syntax as literal text", () => {
    expect(toTiptapContent("**Welcome** to the _blog_")).toBe("<p>**Welcome** to the _blog_</p>");
  });
});
