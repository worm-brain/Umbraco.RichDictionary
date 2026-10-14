import { describe, expect, it } from "vitest";
import { detectForeignFormat } from "./format-mismatch.js";

describe("detectForeignFormat", () => {
  describe("in Rte mode", () => {
    it.each([
      ["bold with asterisks", "Read our **terms** first."],
      ["bold with underscores", "Read our __terms__ first."],
      ["a link", "See the [privacy policy](/privacy)."],
      ["a heading", "## Opening hours\nMonday to Friday"],
    ])("flags Markdown %s", (_case, value) => {
      expect(detectForeignFormat(value, "Rte")).toBe("Markdown");
    });

    it.each([
      ["plain text", "Terms and conditions apply."],
      ["a footnote asterisk", "From £10 per night*"],
      ["arithmetic", "2 * 3 = 6 and 2 ** 3 = 8"],
      ["comparisons", "Prices < £10 or > £50"],
      ["square brackets without a link target", "Choose [one] option (only)"],
      ["a hash that isn't a heading", "#1 choice for families"],
      ["an empty value", ""],
    ])("ignores %s", (_case, value) => {
      expect(detectForeignFormat(value, "Rte")).toBeUndefined();
    });

    it("ignores HTML saved by the rich text editor, even with asterisks in it", () => {
      expect(detectForeignFormat("<p>Offer ends **soon**</p>", "Rte")).toBeUndefined();
    });
  });

  describe("in Markdown mode", () => {
    it.each([
      ["a paragraph", "<p>Sign up to our <strong>newsletter</strong>.</p>"],
      ["several paragraphs", "<p>One</p><p>Two</p>"],
      ["a list", "<ul><li>One</li><li>Two</li></ul>"],
      ["surrounding whitespace", "  <p>Padded</p>\n"],
    ])("flags rich text editor HTML: %s", (_case, value) => {
      expect(detectForeignFormat(value, "Markdown")).toBe("Html");
    });

    it.each([
      ["plain text", "Terms and conditions apply."],
      ["Markdown", "Read our **terms** first."],
      ["inline HTML, which Markdown allows", "Water is H<sub>2</sub>O"],
      ["comparisons", "Prices < £10 or > £50"],
      ["text that merely starts with a tag", "<p> marks a paragraph"],
    ])("ignores %s", (_case, value) => {
      expect(detectForeignFormat(value, "Markdown")).toBeUndefined();
    });
  });

  it("never flags anything in Plain mode", () => {
    expect(detectForeignFormat("<p>**Both**</p>", "Plain")).toBeUndefined();
  });
});
