# Optional plugins

Blueprint's canvas and preview runtime do not depend on Redux or a design-token
implementation. Optional packages contribute inspector tools through the small
`BlueprintPlugin` / `BlueprintToolContribution` contract from
`@react-native-blueprint/core`.

## Redux

`@react-native-blueprint/plugin-redux` accepts any Redux-compatible store with
`getState()` and `subscribe()`. It does not own or create the application
store.

```ts
import { createReduxInspectorPlugin } from '@react-native-blueprint/plugin-redux';

const reduxPlugin = createReduxInspectorPlugin({
  store,
  select: (state) => state.auth,
});
```

Screens that require a Redux provider should receive it through the preview
provider composition API documented in `docs/PREVIEW_PROVIDERS.md`. This keeps
Redux out of Blueprint's required dependency graph.

## Design tokens

`@react-native-blueprint/plugin-tokens` works against an explicit token source.
Reading, subscriptions and updates are delegated to the consumer:

```ts
import { createTokenInspectorPlugin } from '@react-native-blueprint/plugin-tokens';

const tokenPlugin = createTokenInspectorPlugin({
  source: {
    getTokens: () => tokenStore.getTokens(),
    subscribe: (listener) => tokenStore.subscribe(listener),
    updateToken: (path, value) => tokenStore.updateToken(path, value),
  },
});
```

The plugin does not start a server, touch the file system or assume Expo. The
example application may still use its own token source, but token initialisation
is no longer a prerequisite for rendering the root application.
