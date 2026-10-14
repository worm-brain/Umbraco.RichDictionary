# ADR 0001: Replace only the core dictionary edit view

- Status: Accepted
- Date: 2026-09-29

## Context

Umbraco's **Translation** section edits each dictionary value in a plain textarea, one per
language. The package exists to swap those textareas for a rich editor. In Umbraco 17.7 the
dictionary item's **Edit** workspace view (`Umb.WorkspaceView.Dictionary.Edit`) is the only place
with those textareas.

A separate section was the other option. But the section's permission alias
(`Umb.Section.Translation`) and its `/section/translation` path are hard-coded into the core tree,
collection, search and workspace links. A new section would mean re-implementing all of them, and
user groups would lose access until someone granted them the new section.

## Decision

- The package replaces only the core **Edit** workspace view. Its own view registers under the
  same label, pathname, icon and weight, so tabs and deep links behave as before.
- The entry point removes the core view with `extensionRegistry.exclude(...)`. No CSS or permission
  tricks.
- The section, tree, create, move, delete, import, export, search and permissions stay core and
  untouched.
- Opening an item must not mark the workspace as changed, or Umbraco asks "discard changes?" on
  every navigation. The editors only report a change on a user edit.

## Consequences

- Installing the package changes one screen; uninstalling brings the stock editor back.
- If an Umbraco upgrade renames the core view's alias, both views would render. A unit test
  (`dictionary-editor/constants.test.ts`) fails when the installed backoffice no longer registers
  the alias, so the upgrade cannot go unnoticed.
- [ADR 0007](0007-save-only-editable-languages.md) adds the one other core piece the package
  replaces.
