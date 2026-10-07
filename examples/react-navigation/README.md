# React Navigation example

This bare React Native example demonstrates the statically inspectable React Navigation integration. The same screen configuration can be used by the application navigator and translated into the common Blueprint manifest with `createReactNavigationStaticManifest`.

`src/App.tsx` intentionally contains no Expo Router dependency.

For runtime or feature-flagged navigator structures, the example creates a Blueprint registry from the static manifest and then calls `registerReactNavigationScreens`. New screen IDs supplement static discovery. An existing ID can be replaced intentionally with `{ replace: true }`; no navigator internals are inspected.
