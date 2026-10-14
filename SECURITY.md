# Security policy

## Supported versions

| Package line | Umbraco | Supported |
| --- | --- | --- |
| `17.x` | 17 | Yes |
| `18.x` | 18 | Yes |
| `1.x` | 17 | No: upgrade to `17.x` |

Security fixes go into the newest release of each supported line.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: on the repository's **Security** tab, choose **Report a
vulnerability**. Include what you found, how to reproduce it, and which package version and
Umbraco version you used.

You will get an acknowledgement, and the fix will be coordinated with you before any details are
published.

## Scope

Rich Dictionary edits dictionary values in the Umbraco backoffice and renders them as HTML on the
site, so reports about these are especially welcome:

- a user editing or saving a language their user groups do not grant;
- access to the package's API without access to the **Translation** section;
- a stored value turning into script in the backoffice editor.

By design, the HTML helpers output the HTML that backoffice users write, unsanitised unless the
site registers an `IHtmlSanitizer`, as Umbraco does for rich text. See
[how values are converted](docs/explanation/how-values-are-converted.md).
