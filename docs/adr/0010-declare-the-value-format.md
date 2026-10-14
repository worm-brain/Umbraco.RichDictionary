# ADR 0010: Declare the stored value format in the package manifest

- Status: Accepted
- Date: 2026-09-30
- Issue: #12

## Context

Tools that work with a site through the Management API, such as the Umbraco CLI, read and write
dictionary values as strings. With the package installed those strings hold HTML or Markdown,
depending on a setting the API does not expose. The CLI defines a manifest extension type,
`umbracoCli`, for packages to declare such things (worm-brain/Umbraco.Cli#439). A static
`umbraco-package.json` cannot read configuration.

## Decision

- An `IPackageManifestReader` (`CliManifestReader`) emits a second package manifest holding one
  `umbracoCli` extension, alias `Umbraco.Community.RichDictionary.Cli`, whose
  `meta.dictionaryValueFormat` follows the editor mode: `html` in `Rte` mode (and for an
  unrecognised mode), `markdown` in `Markdown` mode.
- The manifest reuses the static manifest's id and version, so clients attribute it to this
  package. Its name is empty on purpose: the backoffice's **Packages > Installed** list shows every
  manifest that has a name.
- The composer inserts the reader at index 0 instead of calling `AddSingleton`.
  `PackagingService` injects a single `IPackageManifestReader`, which DI resolves to the last
  registration, the core App_Plugins reader. Appending ours would hide every other package from it.

## Consequences

- `GET /umbraco/management/api/v1/manifest/manifest` tells clients what the dictionary holds.
- Umbraco never merges manifests by id, so the response lists ours and the static one as separate
  entries.
- Umbraco caches manifests for 30 days in the `Production` runtime mode and 10 seconds otherwise,
  so in production a mode change reaches clients only after a restart.
- The backoffice tolerates an extension type nothing registers: it rejects only entries without a
  type or alias, or with a duplicate alias.
