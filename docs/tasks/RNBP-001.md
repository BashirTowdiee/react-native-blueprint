# RNBP-001: Package/workspace boundaries and public API

**Phase:** Foundation

**Priority:** P0

**Status:** TODO

## Objective

Convert the single Expo prototype repository into package-oriented boundaries suitable for installation by external React Native applications.

## Scope

- Define workspace/package tooling.
- Rename package metadata away from `custom-ide`.
- Establish package dependency direction.
- Define supported public entry points.
- Keep the current prototype runnable while extraction begins.
- Add shared TypeScript/build configuration appropriate for publishable packages.

## Acceptance criteria

- Repository has explicit package boundaries for core, React Native rendering and navigation adapters.
- Core packages do not depend on Expo Router, React Navigation, Redux or Expo.
- Public exports are documented and do not rely on deep imports.
- Example/demo code is separated from publishable package code.
- Type checking can run across all workspaces.
- Existing prototype behaviour remains available during migration.

## Notes

This ticket establishes structure only. Avoid prematurely moving Redux/token tooling into core APIs.
