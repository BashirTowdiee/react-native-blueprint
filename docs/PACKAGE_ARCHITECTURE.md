# Package Architecture

React Native Blueprint is organised into focused packages. The Expo Router
consumer under `examples/expo-router` hosts the Open Social workbench; the
original prototype application has been removed.

## Packages

| Package | Responsibility | Allowed internal dependencies |
| --- | --- | --- |
| `@react-native-blueprint/core` | Navigation-independent Blueprint domain and registry | None |
| `@react-native-blueprint/react-native` | React Native canvas and preview rendering | `core` |
| `@react-native-blueprint/expo-router` | Expo Router discovery and route adaptation | `core` |
| `@react-native-blueprint/react-navigation` | React Navigation adaptation | `core` |
| `@react-native-blueprint/plugin-redux` | Optional Redux inspection | `core` |
| `@react-native-blueprint/plugin-tokens` | Optional design-token tooling | `core` |

## Dependency rules

- `core` must remain independent of Expo, Expo Router, React Navigation, Redux and React Redux.
- Navigation adapters may depend on `core`, but not on each other.
- Optional plugins may depend on `core`, but not on navigation adapters.
- React Native rendering belongs in `react-native`, not `core`.
- Application/demo code must not be imported by anything under `packages/`.

These rules are executable through `yarn check:boundaries`.

## Public entry points

Packages expose their documented public entry points through `exports`. Consumers must use:

```ts
import {} from '@react-native-blueprint/core';
import {} from '@react-native-blueprint/react-native';
import {} from '@react-native-blueprint/expo-router';
import {} from '@react-native-blueprint/react-navigation';
import {} from '@react-native-blueprint/plugin-redux';
import {} from '@react-native-blueprint/plugin-tokens';
import {} from '@react-native-blueprint/react-native/dev';
```

Deep imports such as `@react-native-blueprint/core/src/...` are intentionally unsupported.
`@react-native-blueprint/react-native/dev` is the only public subpath and contains
the development guard helpers.

## Build and type checking

The root uses Yarn 4 workspaces.

```bash
yarn install --immutable
yarn check:boundaries
yarn typecheck
yarn build:packages
yarn test:ci
```

Package TypeScript settings inherit from `tsconfig.base.json`. Each package compiles independently into a local `dist/` directory, which remains untracked.

## Prototype boundary

The Expo application lives under `examples/expo-router` and consumes Blueprint through public package exports. Publishable package code lives exclusively under `packages/`. The former root-level application folders and Expo starter reset script have been removed after the RNBP-006 migration.

### Optional inspection tooling entries

`@react-native-blueprint/react-native/babel` is a CommonJS development compiler
plugin. `@react-native-blueprint/react-native/devtools` is a pre-React transport
adapter accepting the official backend from the integrating app. Both are
explicit, typed, packaged exports. Neither requires another Blueprint package
beyond core; the runtime has no mandatory DevTools dependency. See INSPECTION.md
for source annotations, external mappings, public-ref picking and the companion.
