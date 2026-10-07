# Package Architecture

React Native Blueprint is being extracted from the original Expo prototype into a set of focused packages. The prototype application remains at the repository root until RNBP-006 moves it into `examples/expo-router`.

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

The Expo application currently under `app/`, `components/`, `design-system/` and related root folders is a migration host only. Publishable package code lives exclusively under `packages/`. RNBP-006 will move the prototype into `examples/expo-router`.
