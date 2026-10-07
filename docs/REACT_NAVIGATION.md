# React Navigation integration

React Native Blueprint supports two React Navigation integration paths without inspecting private navigator internals.

## Static configuration

Use `createReactNavigationStaticManifest` for statically inspectable stack, tab, drawer or custom navigator configuration. Nested screens are flattened into the common Blueprint manifest with stable IDs such as `react-navigation:Library/Stories`.

## Runtime and dynamic configuration

Create a normal Blueprint registry, seed it with any statically discovered screens, then explicitly register runtime screens:

```ts
const registry = createBlueprintScreenRegistry(staticManifest);

registerReactNavigationScreens(registry, [
  {
    routeName: 'RemoteFeature',
    screen: RemoteFeatureScreen,
    params: { source: 'runtime' },
  },
]);
```

Registrations with new IDs supplement discovery. To intentionally override a discovered screen, use the same ID and `{ replace: true }`. Replacement uses the same deterministic semantics as Core's `registerBlueprintScreens` API.

`createReactNavigationRouteVariant` supplies deterministic route params and optional variant renderers through the common Blueprint variant contract. `createReactNavigationPreviewContext` provides deterministic route and navigation values for preview wrappers or application-specific provider adapters.
