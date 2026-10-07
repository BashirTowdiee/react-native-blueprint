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
