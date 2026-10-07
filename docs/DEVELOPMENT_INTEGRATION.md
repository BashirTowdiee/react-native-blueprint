# Development-only integration

Blueprint is development tooling. Applications should mount or register it only
for development builds.

The explicit development entry is:

```ts
import {
  BlueprintDevelopmentGuard,
  isBlueprintDevelopmentEnabled,
} from '@react-native-blueprint/react-native/dev';
```

`isBlueprintDevelopmentEnabled()` uses React Native's `__DEV__` flag by
default. Tests and custom build systems can pass an explicit boolean.

## Expo Router

A file-based route cannot rely on tree-shaking alone to disappear from the
bundle. Guard the route and redirect production access:

```tsx
import { Redirect } from 'expo-router';
import {
  isBlueprintDevelopmentEnabled,
} from '@react-native-blueprint/react-native/dev';

export default function BlueprintRoute() {
  return isBlueprintDevelopmentEnabled()
    ? <BlueprintCanvas />
    : <Redirect href="/" />;
}
```

For environments that require the route module itself to be absent from a
production bundle, exclude the Blueprint route from the production source tree
or build configuration. Metro's dead-code elimination is an optimisation, not
an access-control boundary.

## React Navigation

Do not add the Blueprint screen to the production navigator:

```tsx
const developmentScreens = isBlueprintDevelopmentEnabled()
  ? { Blueprint: BlueprintScreen }
  : {};

const screens = {
  Home: HomeScreen,
  ...developmentScreens,
};
```

Alternatively, wrap a development-only surface in
`BlueprintDevelopmentGuard`.

## Import behaviour

Blueprint packages are marked `sideEffects: false`. Core and navigation
adapters do not start servers, perform network requests or mutate files when
imported. Optional token persistence belongs to the application's token source,
not the Blueprint package.

Do not depend on tree-shaking as the only production safeguard. The primary
safeguard is explicit development-only mounting/registration.
