# Customise the toolbar

In `Rte` mode the editor has a built-in toolbar for short copy: bold, italic, underline, strike,
subscript and superscript, bullet and numbered lists, links, clear formatting, undo and redo, and
source view.

To use your own buttons, point the dictionary at a rich text data type.

1. In **Settings > Data Types**, create a data type with the **Rich Text Editor** property editor,
   or pick one you already have.
2. Design its toolbar there.
3. Set `RichTextDataType` to the data type's key (a GUID) or its name in `appsettings.json`:

   ```json
   {
     "RichDictionary": {
       "RichTextDataType": "Dictionary Rich Text"
     }
   }
   ```

4. Reload the backoffice.

The dictionary editor now uses that data type's Tiptap extensions and toolbar. The data type's
other settings, such as stylesheets, dimensions, blocks and media, are not used.

## What is always left out

Media, blocks and embeds do not belong in dictionary values, so these are removed even when the
data type has them:

- Extensions: `Umb.Tiptap.Image`, `Umb.Tiptap.MediaUpload`, `Umb.Tiptap.Figure`,
  `Umb.Tiptap.Embed`, `Umb.Tiptap.Block`.
- Toolbar buttons: **Media picker**, **Embedded media**, **Block picker**.

So you can point it at your site's main rich text data type without media buttons appearing.

## When the setting does not match

- If the setting does not match a rich text data type, the server logs a warning and the built-in
  toolbar is used.
- Unknown toolbar items or extensions are skipped, with a warning in the browser console.
- If no buttons are left, the built-in toolbar is used.

## Related

- [Configuration](../reference/configuration.md)
- [Choose the editor mode](choose-the-editor-mode.md)
