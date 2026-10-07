# React Native Blueprint

React Native Blueprint is a development tool for viewing React Native screens together on a blueprint-style canvas. This repository is being refactored from the original in-app IDE experiment into installable, navigation-agnostic packages.

The current Expo application remains the migration prototype while the package APIs are extracted.

## Workspace

The repository uses Yarn 4.18.1 with the `node-modules` linker.

```bash
yarn install --immutable
yarn web
```

The current Blueprint prototype is available at `/ide` when running the web app.

## Package boundaries

The package workspace now contains:

- `@react-native-blueprint/core`
- `@react-native-blueprint/react-native`
- `@react-native-blueprint/expo-router`
- `@react-native-blueprint/react-navigation`
- `@react-native-blueprint/plugin-redux`
- `@react-native-blueprint/plugin-tokens`

See `docs/PACKAGE_ARCHITECTURE.md` for dependency rules and supported public entry points.

## Validation

```bash
yarn check:boundaries
yarn typecheck
yarn build:packages
yarn test:ci
```

## Refactor status

The implementation plan and ticket backlog live under `docs/`. The first goal is to extract Blueprint View without requiring application screens to know about Blueprint and without coupling core to Expo Router, React Navigation or Redux.
