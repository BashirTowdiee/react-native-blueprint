# React Native Blueprint Refactor Plan

## Goal

Turn the current ReactNativeIDE experiment into an installable, development-only React Native package focused on **Blueprint View**.

The package should let an application render multiple screens and screen variants together on a zoomable blueprint canvas without requiring application screens to know that Blueprint exists.

The first supported navigation integrations are:

- Expo Router
- React Navigation in bare React Native

## Architectural rules

1. Blueprint Core owns canvas behaviour, artboards, viewport metadata, selection, pan/zoom, groups and variants.
2. Blueprint Core must not import Expo Router, React Navigation, Redux or Expo.
3. Navigation adapters translate application navigation structure into a common Blueprint screen manifest.
4. Application screens must not require Blueprint-specific props such as `designing`.
5. App-specific providers, fixtures and route params are supplied through explicit preview configuration.
6. Redux inspection and design-token editing are optional plugins, not dependencies of Blueprint View.
7. Blueprint must be development-only and removable from production bundles/configuration.
8. Automatic discovery is an adapter convenience. The stable contract is an explicit screen registry/manifest.

## Target package shape

```text
packages/
  core/                     # Manifest, registry and canvas model
  react-native/             # BlueprintView and React Native rendering primitives
  expo-router/              # Expo Router discovery + route metadata adapter
  react-navigation/         # React Navigation static/dynamic adapters
  plugin-redux/             # Optional state inspector
  plugin-tokens/            # Optional token inspector/editor

examples/
  expo-router/
  react-navigation/
```

The exact workspace tooling can be decided in RNBP-001, but package boundaries above are the intended dependency direction.

## Common screen contract

The refactor should converge on a navigation-independent manifest similar to:

```ts
type BlueprintScreen = {
  id: string;
  name: string;
  render: React.ComponentType<any>;
  route?: {
    pathname?: string;
    params?: Record<string, unknown>;
  };
  variants?: BlueprintVariant[];
  viewport?: BlueprintViewport;
  metadata?: Record<string, unknown>;
};
```

Adapters may discover or generate this contract. Consumers must also be able to register it manually.

## Current prototype coupling to remove

- `app/(ide)/index.tsx` and `app/ide.tsx` duplicate the Blueprint implementation.
- Blueprint directly imports four demo application screens.
- Blueprint directly reads Redux state.
- Blueprint directly owns token editing.
- The app root initialises the token server before rendering.
- Demo screens import Expo Router and use a Blueprint-only `designing` prop to suppress navigation.
- Dynamic route examples read Expo Router params directly, making deterministic preview fixtures difficult.

These are acceptable prototype shortcuts but are incompatible with a plug-and-play package.

## Refactor phases

### Phase 0: Foundation

- RNBP-001 Package/workspace boundaries and public API

### Phase 1: Blueprint Core extraction

- RNBP-002 Extract canvas and artboard primitives
- RNBP-003 Add screen manifest and registry
- RNBP-004 Add preview host/provider boundary
- RNBP-005 Remove Blueprint-specific app screen behaviour

### Phase 2: Expo Router integration

- RNBP-006 Move prototype app into Expo Router example
- RNBP-007 Implement Expo Router discovery adapter
- RNBP-008 Add dynamic-route fixtures and variants

### Phase 3: Bare React Native integration

- RNBP-009 Implement React Navigation static adapter
- RNBP-010 Implement React Navigation dynamic registration
- RNBP-011 Add provider composition for previews

### Phase 4: Productise Blueprint View

- RNBP-012 Extract Redux and token tooling into optional plugins
- RNBP-013 Complete Blueprint canvas UX and metadata
- RNBP-014 Add development-only entry and production safeguards

### Phase 5: Package readiness

- RNBP-015 Compatibility tests, documentation and release readiness

## Dependency order

```text
RNBP-001
  ├─ RNBP-002 ─ RNBP-003 ─ RNBP-004 ─ RNBP-005
  │                         ├─ RNBP-006 ─ RNBP-007 ─ RNBP-008
  │                         └─ RNBP-009 ─ RNBP-010
  ├────────────────────────────────────── RNBP-011
  └────────────────────────────────────── RNBP-012

RNBP-002 + RNBP-003 + adapters ─ RNBP-013 ─ RNBP-014 ─ RNBP-015
```

## Refactor completion criteria

The refactor is complete when:

- an Expo Router app can install Blueprint and render discovered/registered screens without modifying those screens;
- a bare React Native app using React Navigation can do the same;
- dynamic routes can provide deterministic params/fixtures and multiple visual variants;
- application providers can be composed around previews without Blueprint importing them;
- Blueprint Core has no imports from Expo Router, React Navigation, Redux or Expo;
- Redux and token tooling can be omitted entirely;
- the examples exercise the published package APIs rather than private source imports;
- production builds can exclude Blueprint;
- tests cover the common registry contract and both navigation adapters.

## Explicit non-goals for this refactor

- Building a general-purpose React Native IDE.
- Source-code editing.
- Replacing Metro, Expo CLI or React Native tooling.
- Making Redux or design tokens mandatory.
- Solving every navigation library before Expo Router and React Navigation are stable.
