# React Native Blueprint

React Native Blueprint is a development tool for viewing React Native screens together on a blueprint-style canvas. This repository is being refactored from the original in-app IDE experiment into installable, navigation-agnostic packages.

The Expo Router demo now lives under `examples/expo-router` and consumes Blueprint through the package public APIs.

Blueprint is not application runtime code. Mount/register it only in development
builds. See `docs/DEVELOPMENT_INTEGRATION.md` for Expo Router and bare React
Navigation patterns and the explicit
`@react-native-blueprint/react-native/dev` guard entry.

## Workspace

The repository uses Yarn 4.18.1 with the `node-modules` linker.

```bash
yarn install --immutable
yarn example:expo:web
```

The Blueprint example route is available at `/ide` when running `examples/expo-router`.
Production access to that route redirects to the application root.

## Package boundaries

The package workspace now contains:

- `@react-native-blueprint/core`
- `@react-native-blueprint/react-native`
- `@react-native-blueprint/expo-router`
- `@react-native-blueprint/react-navigation`
- `@react-native-blueprint/plugin-redux`
- `@react-native-blueprint/plugin-tokens`

See `docs/PACKAGE_ARCHITECTURE.md` for dependency rules and supported public entry points.

Installation and integration examples are in `docs/QUICK_START.md`. Supported
version floors and the currently validated baseline are in
`docs/COMPATIBILITY.md`.

## Validation

Blueprint packages use coordinated semantic versions. `yarn release:version
<version>` updates all six packages and the public version constant; run `yarn
install` afterward. `yarn release:pack` creates library-only archives and a manifest
with their SHA-256 hashes and exact clean source commit. See the release checklist
for local pinned consumers and publication. Blueprint Settings shows the installed
version and, when supplied by the app, its release provenance.

```bash
yarn check:boundaries
yarn typecheck
yarn build:packages
yarn test:ci
yarn smoke:examples
yarn validate:packages
```

`yarn validate:release` runs the complete package boundary, build, typecheck,
test, example smoke and package-content validation sequence.

## Refactor status

The RNBP-001 through RNBP-015 refactor is complete. Blueprint View no longer
requires application screens to know about Blueprint and core remains
independent of Expo Router, React Navigation and Redux.

## Inspection workbench and showcase

The `/ide` route opens **Open Social**, an interactive offline showcase with
72 fixture posts. **Navigation** runs one app-owned navigation stack; **Navigation
flow** builds a horizontal route hierarchy from navigation actions, with mapped
or discovered placeholders; **All screens** mounts all 10 previews together.
Navigation is the default.
Switching modes starts a fresh session. The development root route opens the
workbench directly; the original Japanese-study demo has been removed.
See [Workspace modes](docs/CANVAS.md#workspace-modes) for the public integration API.

The workbench adds screen/component/data search, wrapper-free source inspection, external config mappings and an optional official
React DevTools companion, optional custom copyable data, saved data comparisons, a data-change
history, device/rotation controls, React render metrics, focus and refresh. See
[Inspection guide](docs/INSPECTION.md) and [workshop decisions](docs/IDE_WORKSHOP.md).

A pinned checkout of the production **Bluesky** app can be recreated with
`yarn showcase:clone`. `yarn showcase:prepare` adds a development harness for its
actual screens. Dependency installation and launch are separate; see
[Bluesky showcase](examples/bluesky/README.md).

The Details **Settings** tab identifies the inspection sources in use. The example
keeps only SettingsPanel wrapped; other elements use development compiler metadata
and external mappings. Run `yarn example:devtools` and choose **Open React tree**
for the actual React component tree, props and hooks in the official companion.
