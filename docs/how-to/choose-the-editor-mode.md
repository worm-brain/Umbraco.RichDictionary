# Choose the editor mode

The package has two editor modes, set once for the whole site:

- **`Rte`** (the default): each language gets Umbraco's Tiptap rich text editor, and values are
  stored as HTML.
- **`Markdown`**: each language gets Umbraco's Markdown editor, and values are stored as Markdown.

![A dictionary item in Markdown mode, with a Markdown editor for each language](../images/editor-markdown.png)

## Set the mode

1. Add the `RichDictionary` section to `appsettings.json`:

   ```json
   {
     "RichDictionary": {
       "EditorMode": "Markdown"
     }
   }
   ```

2. Restart the site.
3. Reload the backoffice. It reads the configuration once per session.

Leave the section out to keep the default, `Rte`.

An unrecognised value, such as a typo, does not stop the site. It falls back to `Rte`, and a
warning naming the value is logged at startup. Names are not case-sensitive.

## Change the mode on a site with values

Choose the mode before editors start saving values. Changing it later does not convert anything:
values saved in the other format stay as they are.

- In `Rte` mode, a Markdown value shows its syntax as plain text, in the editor and on the site.
- In `Markdown` mode, an HTML value shows its tags as text in the editor. On the site, Markdown
  passes most HTML through, so it often still renders.

After a change, open the items you know have values. The editor shows a warning under a value
that looks like it is in the other format. Fix those values by hand before you save them.

## Related

- [Configuration](../reference/configuration.md)
- [How values are converted](../explanation/how-values-are-converted.md)
