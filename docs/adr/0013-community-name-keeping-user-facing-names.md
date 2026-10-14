# ADR 0013: Use the Umbraco.Community.RichDictionary name, keeping user-facing names

- Status: Accepted
- Date: 2026-10-14

## Context

nuget.org reserves the `Umbraco.` prefix, so the package was published as
`Umbraco.Community.RichDictionary` while its assembly, namespaces, solution, manifest id and
`App_Plugins` folder were still named `Umbraco.RichDictionary`. The sibling `Umbraco.Community.*`
packages use the package id everywhere.

## Decision

- The assembly, root namespace, solution, Umbraco manifest id, extension aliases
  (`Umbraco.Community.RichDictionary.*`, including the `.Cli` declaration), appsettings schema file
  and `App_Plugins/UmbracoCommunityRichDictionary` folder all use the package id.
- Names that sites and API clients depend on keep their original form: the `RichDictionary`
  configuration section, the `umbracorichdictionary` API route and API document name, the
  `rich-dictionary-*` element tags and the stored value formats.
- The `buildTransitive` targets file must be named after the package id, or NuGet does not import
  it.

## Consequences

- A breaking change for anything that referenced the old C# namespace, static asset paths or
  extension aliases; it ships in the 17.0.0 major with upgrade notes in the changelog.
- An upgraded site keeps the old schema file and its `$ref` until someone deletes them.
