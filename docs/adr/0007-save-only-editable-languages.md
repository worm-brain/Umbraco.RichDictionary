# ADR 0007: Save only the languages the user may edit

- Status: Accepted
- Date: 2026-09-30
- Issue: #5

## Context

A user group can grant access to some languages only. The core dictionary save sends every
translation, and the Management API rejects the whole update (403) when it names any language
the user's groups do not grant, even an unchanged one. So a user without access to every language
can never save a dictionary item. Stock Umbraco has the same bug.

## Decision

- The package's edit view shows the languages a user may not edit read-only, with the same rules
  as the core view.
- The entry point swaps the core `Umb.Repository.Dictionary.Detail` for a subclass registered
  under the same alias (`dictionary-editor/dictionary-detail.repository.ts`). Its `save` sends only
  the translations the user may edit; the API keeps the stored value of every language left out.

## Consequences

- Users with access to some languages can save. Nothing extra needs granting: the package uses
  the core Translation section permissions.
- This is the one core piece the package replaces besides the edit view
  ([ADR 0001](0001-replace-only-the-dictionary-edit-view.md)). A unit test guards its alias too.
- Uninstalling restores core behaviour, and with it the core bug.
