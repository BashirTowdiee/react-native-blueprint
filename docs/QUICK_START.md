# Quick start

React Native Blueprint is development tooling. Install the renderer plus the
adapter for the navigation stack used by the application.

## Expo Router

```bash
yarn add -D @react-native-blueprint/core \
  @react-native-blueprint/react-native \
  @react-native-blueprint/expo-router
```

Discover routes through Metro's public `require.context` surface, convert them
to artboards and guard the Blueprint route in production. In Expo Router, a
route group such as `(ide)` is URL-transparent, so use a named file such as
`app/(ide)/ide.tsx` when the Blueprint surface should live at `/ide`:

```tsx
import React from 'react';
import { Redirect } from 'expo-router';
import {
  discoverExpoRouterScreensFromContext,
} from '@react-native-blueprint/expo-router';
import {
  BlueprintPreviewHost,
  BlueprintView,
} from '@react-native-blueprint/react-native';
import {
  isBlueprintDevelopmentEnabled,
} from '@react-native-blueprint/react-native/dev';

const routeContext = require.context('..', true, /^\.\/.*\.(ts|tsx)$/);
const screens = discoverExpoRouterScreensFromContext(routeContext, {
  excludeFiles: ['./(ide)/ide.tsx'],
});

export default function BlueprintRoute() {
  if (!isBlueprintDevelopmentEnabled()) {
    return <Redirect href="/" />;
  }

  return (
    <BlueprintView
      artboards={screens.map((screen) => ({
        id: screen.id,
        label: screen.name,
        viewport: screen.viewport,
        metadata: screen.metadata,
        content: <BlueprintPreviewHost screen={screen} />,
      }))}
    />
  );
}
```

Dynamic routes can define fixtures and variants through
`discoverExpoRouterScreensFromContext`. See the Expo example and adapter tests
for the fixture contract.

## React Navigation

```bash
yarn add -D @react-native-blueprint/core \
  @react-native-blueprint/react-native \
  @react-native-blueprint/react-navigation
```

Translate a statically inspectable navigator configuration into the common
manifest. Runtime or feature-flagged screens are registered explicitly:

```tsx
import {
  createBlueprintScreenRegistry,
} from '@react-native-blueprint/core';
import {
  BlueprintPreviewHost,
  BlueprintView,
} from '@react-native-blueprint/react-native';
import {
  BlueprintDevelopmentGuard,
} from '@react-native-blueprint/react-native/dev';
import {
  createReactNavigationStaticManifest,
  registerReactNavigationScreens,
} from '@react-native-blueprint/react-navigation';

const staticManifest = createReactNavigationStaticManifest(navigationConfig);
const registry = createBlueprintScreenRegistry(staticManifest);

registerReactNavigationScreens(registry, runtimeRegistrations);

export function BlueprintScreen() {
  const artboards = registry.list().map((screen) => ({
    id: screen.id,
    label: screen.name,
    viewport: screen.viewport,
    metadata: screen.metadata,
    content: <BlueprintPreviewHost screen={screen} />,
  }));

  return (
    <BlueprintDevelopmentGuard fallback={null}>
      <BlueprintView artboards={artboards} />
    </BlueprintDevelopmentGuard>
  );
}
```

## Fixtures, variants and application context

The common manifest supports `route`, `viewport`, `metadata` and
`variants`. Navigation adapters populate those values without changing the
application screen components.

Screens that require Redux, theme, query-client, localisation or other context
should use `BlueprintPreviewHost.providers`. Composition is root, then screen,
then variant. See `docs/PREVIEW_PROVIDERS.md`.

Redux and design-token inspection are optional plugins. See
`docs/PLUGINS.md`. Neither plugin is required for the canvas.
