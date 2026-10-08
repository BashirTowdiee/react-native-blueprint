# Blueprint canvas

`BlueprintView` is the navigation-independent surface for browsing previews.

## Workspace modes

`BlueprintWorkspace` offers three distinct mounting policies in a single header:

- **Navigation** (default) mounts only the supplied `application` root. Its own
  navigator decides when screens mount, remain mounted in a stack/tab, or unmount.
  Blueprint does not render registered artboards in this mode.
- **All screens** mounts every registered artboard. Focus and search preserve
  mounted previews; hidden previews can still run effects and subscriptions.
- **Navigation flow** mounts only the active preview branch. A supplied map
  creates inert placeholders first; without a map, navigation creates nodes and
  connections on demand. Back unmounts popped screens and preserves placeholders.

```tsx
import {
  BlueprintWorkspace,
  useBlueprintNavigationReporter,
} from '@react-native-blueprint/react-native';

<BlueprintWorkspace
  applicationName="My app"
  application={<ApplicationRoot />}
  applicationViewport={{ width: 390, height: 844 }}
  artboards={previewArtboards}
  defaultMode="navigation"
/>;
```

Supply the app's navigator and app-owned providers inside `ApplicationRoot`.
Use `useBlueprintNavigationReporter()` inside that root to observe its existing
navigation events. Call the returned function on initial readiness and route
changes with `{ name, pathname, params }`. Reports update the workspace's active
route and bounded/redacted inspector metadata without remounting the app or
performing navigation. The hook is a no-op outside Navigation mode. Apps without
an observer can still run; the workspace reports that it is waiting for app
navigation rather than inferring a route. See
`examples/expo-router/showcase/SocialNavigationApp.tsx` for a working stack.

The `mode` / `onModeChange` props support controlled mode selection. `previewProps`
passes canvas/inspector options through to `BlueprintView`. Navigation mode hides
the fixture navigator and focus toggle and labels the refresh action **Restart
app**, because it remounts the application root. App-owned external stores and
services are reset only if the app owns them inside that root.

Switching modes unmounts the old session before mounting the new one. This avoids
running a live app alongside all its previews, but local state is reset. Viewport
changes, zoom, inspection and active-route reports preserve the live app instance.
This preserves the supplied navigator's lifecycle; the preview frame and React
Profiler still add development overhead. It does not measure production performance
or replay the lifecycle of an already-running external app.

## Navigation flow integration

Supply `flow` to `BlueprintWorkspace` to enable the third mode:

```tsx
const flow = {
  initialRoute: { id: 'home', name: 'Home' },
  navigationMap: {
    nodes: [
      { route: { id: 'home', name: 'Home' } },
      { route: { id: 'profile', name: 'Profile' }, parentId: 'home' },
      { route: { id: 'settings', name: 'Settings' }, parentId: 'home' },
    ],
  },
  renderScreen(route, navigation) {
    return <AppScreen
      route={route}
      onNavigate={navigation.navigate}
      onBack={navigation.goBack}
    />;
  },
  wrapScreens: (screens) => <AppProviders>{screens}</AppProviders>,
};

<BlueprintWorkspace application={<ApplicationRoot />} artboards={previewArtboards} flow={flow} />;
```

`BlueprintNavigationFlowConfig` types this contract. Each destination has a stable
`id`, a `name`, optional `pathname`, `params` and viewport. Keep IDs distinct when
two parameterized destinations must have separate screen instances. Return a
screen element from `renderScreen`; do not eagerly call screen components.
`useBlueprintFlowNavigation()` also exposes the per-screen actions to descendants.

A map can include explicit `parentId` hierarchy and additional directed `links`.
When only links are supplied, Blueprint infers a finite spanning tree. Cross-links
and navigation cycles remain connections without changing established levels.
Omit `navigationMap` to build the tree from clicked paths. The Mapped/Discover
control switches these policies when a map exists and starts a fresh flow.

Forward navigation retains the branch to its source, mounts the destination and
disposes descendants replaced by a different path. Navigating to an ancestor
pops back to it. Explicit Back removes the source and its descendants. Popped
nodes remain marked **Unmounted**; unused mapped nodes say **Not visited**. Selecting
a placeholder does not mount it or produce render metrics. Only navigation does.

Depth grows horizontally, and peers at each depth are arranged vertically. Mixed
viewports are measured before placement so cards do not overlap. Each transition
pans to the destination and fits the complete device in the available canvas.
Fit gives a whole-flow overview. Connections use free channels around all screen
frames, with rounded turns, visible ports and thicker strokes. The latest active
connection stays highlighted above the others; a moving pulse indicates direction.
Reduced motion keeps the highlight and removes movement.

The flow is an explicit preview mounting policy, not a replacement for the
single-app navigator. Wire app-owned navigation actions through the supplied
adapter; Blueprint does not infer buttons from private React internals. Providers
inside `wrapScreens` are shared by the live branch. Restart flow remounts that
provider/session tree and clears discovered paths; Restart screen resets only
that live screen. Switching workspace modes also disposes the current flow.

The workspace header includes modes, breadcrumbs, route counts, map/restart
actions and **Pick component**. Picking opens Components and synchronizes the
selected source card, component row and canvas outline. Drawers collapse from
heading chevrons and reopen from persistent canvas edge tabs. Collapsing drawers
or zooming does not remount screens. The header scrolls horizontally on narrow
windows rather than stacking additional rows.

## Artboards and grouping

Artboards can be grouped with `groupId` and `groupLabel`. The navigation
examples use the screen ID as the group and place each fixture/variant inside
that group.

Each artboard can carry:

- `viewport`: manifest-derived width, height and optional name.
- `metadata`: adapter or application metadata shown in the selection inspector.
- `groupId` / `groupLabel`: visual grouping for screen variants.

Selecting an artboard focuses it and opens the metadata inspector. Web uses one
scroll surface with horizontal and vertical overflow enabled together, so a
trackpad gesture can pan diagonally with browser momentum. Drag empty canvas
space with the primary mouse button, or use the middle button over a preview.
App controls and native scrollbar tracks keep their normal interactions. Native
uses a background pan responder to move both scroll axes during a touch drag;
scrolling inside a screen remains app-owned. Zoom controls support bounded zooming and a
Reset action restores the configured initial zoom and default selection.

## Viewports

`BLUEPRINT_DEVICE_PRESETS` provides compact phone, standard phone and tablet
presets. `createBlueprintViewportFromPreset()` converts a preset to the common
`BlueprintViewport` shape.

Custom dimensions use the same shape and do not need to match a preset:

```tsx
{
  id: 'checkout:wide',
  label: 'Wide checkout',
  viewport: {
    name: 'Custom QA viewport',
    width: 430,
    height: 932,
  },
  content: <CheckoutPreview />,
}
```

Manifest/variant viewport values should be passed through directly so the size
shown by the canvas matches the preview contract rather than a navigation
adapter-specific assumption.

## Inspection workbench

The screen navigator searches route metadata, component names and exposed data.
It focuses a matching artboard while preserving mounted preview state. The
inspector includes Data, Components and Activity tabs, copyable reports and a
per-preview refresh control. See [Inspection](INSPECTION.md) for the opt-in
component API, native clipboard integration, metrics and limitations.

### Last-view images and returning to the active screen

In Navigation flow, Back and branch replacement capture outgoing viewports before
unmounting their screens. A dimmed PNG with a **Last view · Unmounted** badge
preserves the visual reference. It contains no live React tree, effects,
interactive controls or inspection regions. Visiting again creates a fresh screen;
leaving again updates its image. Unvisited mapped routes remain empty placeholders.
Images belong to the current flow session and clear on Restart or mode/map changes.

Web capture clones the currently rendered DOM with computed styles into a detached
SVG, then rasterizes it to PNG. It uses already rendered media pixels rather than
fetching resources. This follows the browser's [SVG image support and resource
restrictions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image).
Cross-origin media, custom web fonts, video, iframes and browser-specific rendering
can need an application-owned capture implementation. Capture is bounded to 2,000
nodes and a 1,600px longest image edge; a failure or 1.5 second timeout preserves
the empty placeholder and lets navigation finish.

Native apps supply `captureScreen` on the flow configuration using their preferred
view capture integration; Blueprint has no native screenshot dependency:

```tsx
const flow = {
  initialRoute,
  renderScreen,
  captureScreen: async (route, view) => captureAppView(view), // image URI
};
```

**Focus active** appears alongside Fit and Reset when the camera has moved away
from the active screen center or its reading zoom. It restores that screen's zoom
and center without resetting navigation or mounting another screen. Fit continues
to show the complete flow. Clicking a placeholder only selects its details.
