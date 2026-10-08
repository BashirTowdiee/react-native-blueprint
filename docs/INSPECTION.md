# Inspecting screens and components

The workbench combines a searchable screen navigator, the preview canvas and a
live inspector. Select a screen in the navigator to focus it; **Show all** returns
to the overview. Focus hides other artboards without unmounting them. Search
matches screen IDs, labels, metadata, registered component names, sources and
exposed data values. It changes the navigator results, not the running previews.

Drawers collapse with their heading chevrons and reopen from the labeled
**Screens** and **Details** tabs at the canvas edges. They have no duplicate
header toggles. **Pick component** opens the Details drawer on **Components**
and enables picking in the preview. On web it can select rendered elements;
native uses measured public refs from compiler instrumentation, plus optional registered regions. Narrow windows use drawer overlays.
**Fit** fits the visible artboards. Artboard chrome sits outside the content
viewport; screens using global dimensions still see the host window.

## Wrapper-free inspection

`BlueprintInspectable` is optional. The compact **Settings** item in the Details navigation strip reports the
active inspection sources, mounted element counts, matching config rules and
DevTools transport status. **About inspection sources** expands their explanations.
The drawer uses one heading and one six-item strip (Elements, Data, Activity,
Changes, Viewport and Settings). Source summaries stay with Elements/Data;
copy/restart actions belong to Data and screen metadata expands with **Screen info**. Each selected element also shows where its data came
from. The Open Social SettingsPanel is the only hand-written wrapped example.

### Automatic development metadata

Add the exported Babel plugin to your application's development configuration:

```js
plugins: development ? [['@react-native-blueprint/react-native/babel', {
  root: repositoryRoot,
  include: ['src/'],
}]] : []
```

The plugin instruments named imports of React Native hosts (including aliases),
without changing application source or adding host layout views. It inserts a
`BlueprintSourceElement` React component that preserves keys, refs, props and
children. Compiler locations identify the exact host JSX opening tag; names
identify its containing named component. This adds development render overhead
and appears in React DevTools. External/node_modules files and production builds
are excluded. Consumers choose the source folders to instrument. The example
instruments its `showcase/` folder only.

Automatic data contains public host metadata: role, label, test ID, accessibility
state and disabled state. It omits input values and callback closures. It does
not extract arbitrary hook state. Nested generated registrations describe the
rendered host hierarchy, which differs from the full React component tree.
Native picking measures forwarded public refs; web uses public DOM markers.
Third-party or uninstrumented native views need their own public ref adapter or
React Native DevTools. Native-device picking is not yet live-qualified.

### External config mappings

```tsx
const inspection = {
  automatic: true,
  mappings: [{
    id: 'search',
    match: { accessibilityLabel: 'Search posts' },
    name: 'Search input',
    sourceLocation: { file: 'src/Search.tsx', line: 24 },
    // Optional app-owned, safely serialized data:
    data: { fixture: 'offline' },
  }],
};
<BlueprintView artboards={artboards} inspection={inspection} />
// With BlueprintWorkspace: previewProps={{ inspection }}
```

Rules match existing test IDs, labels (exact or `{ prefix: 'Open ' }`), compiler
component names and host names. All supplied fields must match; the first match
wins. Config names and supplied sources override compiler metadata. Omitted
source locations retain the compiler's exact source. Set `automatic: false` to
register only matched elements. On web, config also maps existing DOM test IDs
and accessibility labels without any compiler or wrapper; this bounded observer
visits at most 2000 eligible nodes and removes registrations on unmount. DOM host
names are HTML tags, while compiler host names are React Native import names.
Mapping locations are app-owned and must be maintained when code moves.

### Official React DevTools companion

Run `yarn example:devtools`, then select **Open React tree** in Blueprint Settings.
The example installs the official backend before React and uses its
[custom messaging API](https://github.com/react/react/blob/main/packages/react-devtools-core/README.md).
Each app window has a separate local session, avoiding mixed trees from other
browser tabs. The companion presents the actual React tree, props and hooks in
the official UI. These values stay there; Blueprint does not copy them into its
data/history store or apply its serialization/redaction policy to DevTools.

The optional `@react-native-blueprint/react-native/devtools` entry accepts an
app-supplied official backend and WebSocket factory. It has no React imports and
must be loaded in a guarded development entry before the renderer. It supports
cleanup, reconnection and an optional frontend-readiness message. The local
example's relay listens on loopback ports 8097 and 8098 and serves Expo's official
frontend; its backend version is pinned to that frontend's 5.2 baseline. The
example connection is excluded from server rendering and production output.

Native apps can use the built-in
[React Native DevTools](https://reactnative.dev/docs/react-native-devtools) from
Metro. Settings labels it as an external developer tool unless the integrating
app supplies a companion connection. Blueprint never reads private Fiber fields.

## Optional custom inspection data

```tsx
import { BlueprintInspectable } from '@react-native-blueprint/react-native';

function PostCard({ post }) {
  return (
    <BlueprintInspectable
      id={post.id}
      name="PostCard"
      source="src/components/PostCard.tsx"
      data={{ post, queryStatus: 'success' }}
    >
      <PostBody post={post} />
    </BlueprintInspectable>
  );
}
```

Enable **Pick component** and click an element. Picking suppresses its normal
button/link action. The source card shows the owning component and its file,
with a line/column when supplied. **Copy file path** copies the file, and **Copy
location** copies `file:line:column` for an editor's file search. Components
highlights and scrolls to the corresponding row. Selecting a row highlights the
same region in the preview and keeps the Components tab open. The outline stays
visible after picking is turned off; normal app interaction is then available.

On web, the list excludes regions hidden by a retained navigator screen while
keeping their registrations and app state. It includes components that are laid
out but clipped or scrolled out of the viewport. Native lists mounted registrations.
Visibility uses public DOM layout and a debounced observer, without React
internals. Component selection subscriptions observe selection only to avoid a
Profiler notification/render feedback loop.

The Components view prioritizes source and named regions. Raw values and saved
data comparisons live in **Data**. Browser element tags/children are behind **Show
rendered elements**, bounded to 4 levels, 12 children per node and 60 elements.
They contain no text snapshots or input values. Child relationships come from nested compiler registrations or optional wrappers;
they do not describe the complete React component tree.
Unknown files are labeled **File not exposed for this component**. If a parent
provides the file, the card explicitly names that source context.

`id` is optional (React `useId` supplies a stable ID). Explicit IDs must be unique
within each artboard. The wrapper adds a `View` in previews; pass `style` when
flex/layout needs to be preserved. Outside Blueprint only children are returned
unless a style was supplied. Optional native region overlays cover nested children; use
the Components list to select nested regions. Use `pickable={false}` for a
layout/source boundary that should register and highlight from the list without
covering its native child targets; use it when defining an optional source boundary.

Source metadata is supplied by the integrating app, without private Fiber fields
or inferred line numbers. **Copy file path** copies `sourceLocation.file`, or the
`source` label before its `#symbol` fragment. Prefer repository-relative or
absolute file paths. A source inherited from the nearest region belongs to that
component, not necessarily the exact clicked element. For exact locations and
an editor link, expose a structured source location and provide `onOpenSource`:

```tsx
<BlueprintInspectable
  name="PostCard"
  sourceLocation={{ file: 'src/components/PostCard.tsx', line: 42, column: 3 }}
  data={{ post }}
>
  <PostBody post={post} />
</BlueprintInspectable>

<BlueprintView artboards={artboards} onOpenSource={(location) => {
  // App-owned editor integration receives file, line and optional column.
  openInEditor(location);
}} />
```

**Open source** appears when that callback is supplied. Blueprint does not guess
an editor URL or unavailable source position. The Open Social development compiler supplies locations automatically for host
JSX and the remaining SettingsPanel wrapper. Explicit wrapper locations take
precedence. Wrapper locations identify the registration tag; host locations
identify the clicked host's JSX tag. See the wrapper-free integration above.

## Copy data

**Copy report** exports screen context, the selected component and render metrics
as JSON. Web uses the clipboard. If clipboard access fails, a selectable export
appears. For native apps, supply your application's clipboard implementation:

```tsx
<BlueprintView
  artboards={artboards}
  onCopy={(text) => Clipboard.setStringAsync(text)}
/>
```

Blueprint has no Expo clipboard dependency. The `Clipboard` in this example is
owned by the integrating app. Text data is also selectable. Common password,
secret, token, authorization and cookie field names are redacted, circular values
are represented safely, and large outputs include a truncation notice. This is
not an exhaustive privacy filter; expose only appropriate development fixtures.

## Activity and refresh

Each preview uses React Profiler to report commit count, last and total React
render duration, last commit time and refresh count. Metric notifications are
batched outside the commit callback. Measurements include development and
inspection overhead; they are not FPS, native layout, memory or production
performance measurements. No timing is inferred from network requests.

**Refresh screen** remounts only the selected preview, resetting its local state,
preview navigation (if inside the preview) and error boundary. Render counters
restart and the refresh count increments. Application-owned shared stores,
providers outside the preview and caches are not reset. The selected component
is cleared until picked again.

In **All screens** mode, all registered previews stay mounted while focused or
searched. Their effects can run in the background, so provider isolation and
deterministic fixtures matter for large applications. **Navigation** mode mounts
one app root and leaves screen mounting/retention to its navigator. See
`CANVAS.md` for the workspace API and `PREVIEW_PROVIDERS.md` for provider isolation.
**Navigation flow** retains only its live branch; Back removes the popped screen's
regions while a dimmed last-view image stays in its placeholder (web capture or
app-supplied native capture). The active connector stays
highlighted, and deeper routes move right while peers stack vertically.

The main Expo `/ide` route defaults to Open Social's Navigation mode. Its app-owned
React Navigation stack shares posts across visited screens. All screens mode
provides ten isolated artboards, including loading, empty and error variants.
The fixtures include 72 posts, six authors and seven product screens. A separately cloned Bluesky production app has
its own prepared development harness; see `../examples/bluesky/README.md`.

## Save data for comparison and follow changes

Select a component and choose **Save data for comparison** in Data. The saved copy stays fixed
while live data continues updating. The comparison shows added, removed and
changed fields with before/after values. **Update saved data** replaces the saved
copy with current values; **Clear saved data** removes it. **0 changed fields**
means nothing differs from the saved copy. These comparisons concern component
values; screen image placeholders are a separate flow feature. Selecting another
component or screen clears the saved copy to prevent unrelated comparisons.

**Copy component data** exports only the selected region's current redacted JSON.
**Copy report** also includes its saved data, computed differences and recent
change events when available.

The **Changes** tab keeps the latest 30 exposed-data/refresh events in each
preview. Filter to the selected component or show all components. **Clear history**
removes recorded events without resetting the preview or render metrics. Initial
component registration is not treated as a change. A refresh is a separate event.
Paths are JSON Pointers (for example `/post/likes`); value previews are shortened
at 256 characters. History retains at most 20 changed fields per event, and
comparison stops at 50 changes, 512 nodes or 8 levels with a truncation notice.
These are observations of exposed data, not an explanation of hook/render causes.

## Device and orientation tools

The **Viewport** tab changes only the selected artboard's content dimensions.
Choose compact phone, standard phone or tablet; rotate dimensions or restore the
fixture viewport. Component state remains mounted. The inspector and exported
report show the current dimensions. The manifest and other previews are unchanged.

App-owned preview adapters can read the dimensions:

```tsx
import { useBlueprintPreviewViewport } from '@react-native-blueprint/react-native';

function ResponsivePreviewProvider({ children }) {
  const viewport = useBlueprintPreviewViewport();
  return <AppResponsiveContext.Provider value={viewport}>{children}</AppResponsiveContext.Provider>;
}
```

The hook returns `undefined` outside a Blueprint preview. It supplies an app
context value; it does not change global React Native Dimensions, browser CSS
media queries, safe areas, device pixel ratio or orientation APIs. The prepared
Bluesky adapter passes it to react-responsive's supported Context and isolates
shell header/footer measurements per preview.
