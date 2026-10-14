import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIPTAP_CONFIGURATION,
  resolveTiptapConfiguration,
  type TiptapExtensionType,
} from "./tiptap-toolbar.js";

// A stand-in for the back-office extension registry, holding a few core aliases.
const REGISTERED: Record<string, TiptapExtensionType> = {
  "Umb.Tiptap.Bold": "tiptapExtension",
  "Umb.Tiptap.Link": "tiptapExtension",
  "Umb.Tiptap.Image": "tiptapExtension",
  "Umb.Tiptap.Toolbar.Bold": "tiptapToolbarExtension",
  "Umb.Tiptap.Toolbar.Link": "tiptapToolbarExtension",
  "Umb.Tiptap.Toolbar.MediaPicker": "tiptapToolbarExtension",
};
const isRegistered = (alias: string, type: TiptapExtensionType) => REGISTERED[alias] === type;

function resolve(richTextEditor: { extensions?: unknown; toolbar?: unknown } | null, richTextDataType = "Dictionary") {
  const warnings: Array<string> = [];
  const configuration = resolveTiptapConfiguration(
    { richTextDataType, richTextEditor },
    isRegistered,
    (message) => void warnings.push(message),
  );
  return { configuration, warnings };
}

describe("resolveTiptapConfiguration", () => {
  it("uses the default toolbar when nothing is configured", () => {
    const warnings: Array<string> = [];

    const configuration = resolveTiptapConfiguration({}, isRegistered, (message) => void warnings.push(message));

    expect({ configuration, warnings }).toEqual({ configuration: DEFAULT_TIPTAP_CONFIGURATION, warnings: [] });
  });

  it("uses the default toolbar when the configuration couldn't be read", () => {
    const configuration = resolveTiptapConfiguration(undefined, isRegistered, () => {});

    expect(configuration).toEqual(DEFAULT_TIPTAP_CONFIGURATION);
  });

  it("uses the data type's extensions and toolbar", () => {
    const { configuration } = resolve({
      extensions: ["Umb.Tiptap.Bold", "Umb.Tiptap.Link"],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold"], ["Umb.Tiptap.Toolbar.Link"]]],
    });

    expect(configuration).toEqual({
      extensions: ["Umb.Tiptap.Bold", "Umb.Tiptap.Link"],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold"], ["Umb.Tiptap.Toolbar.Link"]]],
    });
  });

  it("silently removes media, block and embed tools", () => {
    const { configuration, warnings } = resolve({
      extensions: ["Umb.Tiptap.Bold", "Umb.Tiptap.Image"],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold"], ["Umb.Tiptap.Toolbar.MediaPicker"]]],
    });

    expect({ configuration, warnings }).toEqual({
      configuration: { extensions: ["Umb.Tiptap.Bold"], toolbar: [[["Umb.Tiptap.Toolbar.Bold"]]] },
      warnings: [],
    });
  });

  it("drops an unknown toolbar item with a warning and keeps the rest", () => {
    const { configuration, warnings } = resolve({
      extensions: ["Umb.Tiptap.Bold"],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold", "Acme.Tiptap.Toolbar.Sparkle"]]],
    });

    expect({ toolbar: configuration.toolbar, warnings }).toEqual({
      toolbar: [[["Umb.Tiptap.Toolbar.Bold"]]],
      warnings: [
        'Ignoring unknown tiptapToolbarExtension "Acme.Tiptap.Toolbar.Sparkle" in RichTextDataType "Dictionary".',
      ],
    });
  });

  it("drops an extension alias used as a toolbar item", () => {
    const { configuration } = resolve({
      extensions: ["Umb.Tiptap.Bold"],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold", "Umb.Tiptap.Link"]]],
    });

    expect(configuration.toolbar).toEqual([[["Umb.Tiptap.Toolbar.Bold"]]]);
  });

  it("drops a non-string item with a warning", () => {
    const { configuration, warnings } = resolve({
      extensions: ["Umb.Tiptap.Bold", 42],
      toolbar: [[["Umb.Tiptap.Toolbar.Bold"]]],
    });

    expect({ extensions: configuration.extensions, warnings }).toEqual({
      extensions: ["Umb.Tiptap.Bold"],
      warnings: ['Ignoring invalid tiptapExtension 42 in RichTextDataType "Dictionary".'],
    });
  });

  it("falls back to the default toolbar when no usable button is left", () => {
    const { configuration, warnings } = resolve({
      extensions: ["Umb.Tiptap.Image"],
      toolbar: [[["Umb.Tiptap.Toolbar.MediaPicker"]]],
    });

    expect({ configuration, warnings }).toEqual({
      configuration: DEFAULT_TIPTAP_CONFIGURATION,
      warnings: ['RichTextDataType "Dictionary" leaves no usable toolbar buttons; using the default toolbar.'],
    });
  });

  it("falls back with a warning when the toolbar isn't a list", () => {
    const { configuration, warnings } = resolve({ extensions: [], toolbar: "Umb.Tiptap.Toolbar.Bold" });

    expect({ configuration, warnings }).toEqual({
      configuration: DEFAULT_TIPTAP_CONFIGURATION,
      warnings: ['RichTextDataType "Dictionary" has no Tiptap extensions and toolbar; using the default toolbar.'],
    });
  });

  it("falls back with a warning when the configured data type couldn't be resolved", () => {
    const { configuration, warnings } = resolve(null, "Missing");

    expect({ configuration, warnings }).toEqual({
      configuration: DEFAULT_TIPTAP_CONFIGURATION,
      warnings: ['RichTextDataType "Missing" is not a rich text data type on this site; using the default toolbar.'],
    });
  });

  it("returns a copy of the default that callers can't use to change it", () => {
    const configuration = resolveTiptapConfiguration(undefined, isRegistered, () => {});

    configuration.extensions.push("Umb.Tiptap.Image");

    expect(DEFAULT_TIPTAP_CONFIGURATION.extensions).not.toContain("Umb.Tiptap.Image");
  });
});
