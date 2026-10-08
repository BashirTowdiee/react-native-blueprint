# Blueprint inspection workshop

The canvas is a preview workspace: it can mount registered screen variants with
fixtures and providers. It cannot replace React DevTools, Metro, a native profiler
or an application's backend.

| Developer question | Tool shipped in this uplift | Evidence / boundary |
| --- | --- | --- |
| Which screen or state am I looking at? | Searchable screen navigator, grouping, focus, route and fixture metadata | Explicit manifest and adapter metadata |
| What component did I touch? | Pick component selects an element and synchronizes Components and the source card | Public React context; works without private Fiber access |
| What data does it contain? | Component files/locations, component search and opt-in live data in Data | Only data explicitly exposed by the app; arbitrary hook state is not introspected |
| Why is it updating? | Per-preview React Profiler commit count and render duration | React render activity; not FPS, memory, network or causal tracing |
| How do I share a finding? | Selectable JSON and Copy report | Web clipboard with manual fallback; native apps can supply `onCopy` |
| Can I start the screen over? | Refresh screen | Remounts local state and error boundary; shared stores remain provider-owned |
| Can this handle a real app? | Social showcase plus pinned Bluesky checkout | Deterministic local fixture showcase; upstream app integration has its own providers/build prerequisites |

## Decisions

- Keep core navigation independent and the renderer free from Expo dependencies.
- Explicit component regions are the portable baseline. Web picking observes public DOM elements; source locations and React component
  names come from explicit registrations and development compiler metadata.
- Put navigation and detail panels beside the canvas; allow toggling them for
  smaller windows. Keep Pick component distinct from normal app interaction.
- Export only bounded, serializable data. Redact common secret-like field names.
  Apps still decide what is appropriate to expose in development.
- Use the Open Social fixture app with feed, thread, profile, notifications,
  search and composer. The original small Expo app has been removed.
- Clone an actual production React Native app at a recorded commit. Preserve
  its license and explain which upstream pieces are used by the local showcase.

## Later ideas

Provider-owned event timelines, error status aggregation, fixture controls,
render comparisons, source-editor linking and an optional React DevTools bridge.
These need separate contracts; no fabricated CPU, memory or network metrics.

## Second workshop: explain change and compare layouts

| Question | Decision | Implemented behavior |
| --- | --- | --- |
| What data changed after I touched a control? | Keep a small observable history | Changes tab records before/after values and JSON Pointer paths for exposed data; newest 30 events per preview |
| How does this state differ from the one I was debugging? | Pin a baseline while live data continues | Save data for comparison keeps a copy of component values; reports include saved values and differences |
| Can I copy only the useful payload? | Separate component export | Copy component data exports the selected region's redacted JSON without screen metadata or metrics |
| Does the screen fit another device/orientation? | Resize the selected artboard | Viewport tab provides compact/standard/tablet presets, rotation and fixture restoration without remounting |
| Can a real app's responsive hooks follow the artboard? | Provide an opt-in adapter hook | useBlueprintPreviewViewport supplies dimensions to app-owned responsive context; Bluesky harness consumes it |

History records observable exposed data changes, not hook causality or network
activity. Diff computation is limited to 50 changes, 512 nodes and 8 levels; event
records retain at most 20 changes with short value previews. This keeps inspector
cost bounded. No secret values are added to history beyond the already-redacted
snapshots supplied by the inspection region.

Next workshop candidates: preview-local event hooks for navigation/network,
provider-owned fixture controls, named saved inspection reports, screenshot
comparison and accessible component-tree integration. Each needs a separate
contract and validation beyond this iteration.
