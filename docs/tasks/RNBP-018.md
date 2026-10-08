# RNBP-018 — Navigation flow canvas

Status: DONE (local web flow and public contracts verified)

## Outcome

Add a third workspace mode that builds a screen flow from navigation actions,
using mapped placeholders when a navigation hierarchy is known. The existing
all-screen and normal single-app modes remain available.

## Acceptance criteria

- A mapped flow starts with only its entry screen mounted; every other mapped
  route is an inert placeholder. With no map, only the entry exists initially.
- Screen navigation mounts the destination and retains the active branch.
  Navigating from an earlier screen replaces its descendants. Back unmounts
  popped screens but preserves their route placeholders and connections.
- On back or branch replacement, visited screens retain a dimmed last-view image
  while their live screen trees unmount. Unvisited routes remain empty placeholders.
  Native capture is supplied by the app; capture failure must not block navigation.
- Focus active appears beside zoom controls after panning or zooming away and
  restores the active screen framing without resetting app state.
- Canvas gestures can move horizontally and vertically together. Web uses one
  scroll surface; empty-canvas dragging preserves app controls and scrollbar use.
- Depth advances horizontally. Routes at the same depth stack vertically without
  overlaps, including when viewport sizes differ.
- Navigation automatically centers the destination and animates a directional
  pulse along its curved connection. Reduced-motion settings are respected.
- Frames, active borders, connection ports and placeholder styling form a clean
  coherent flow view. Placeholders do not execute screen effects or fake metrics.
- A single compact header holds all workspace controls. Pick component enables
  element selection on web and region selection on native; Details toggles the information drawer. Both drawers have
  collapse controls and persistent canvas edge tabs to reopen without resetting screens.
- Web picking suppresses app actions, shows bounded rendered children and nearby
  registered components. Details copies known file paths and accepts explicit
  source positions/editor callbacks; unavailable positions are labeled unknown.
- Thicker connections avoid every screen frame. The active route remains bright
  above other connections after its moving pulse finishes.
- The public contract remains navigation independent. The social integration
  wires actual screen navigation buttons to it and shares app-owned providers.
- Meaningful lifecycle/layout tests, package/example checks and browser evidence
  cover mapped/discovered flows, back, branching, focus, pulse and mode switches.

## Scope

Flow mode is an explicit preview navigation branch; normal Navigation mode still
delegates lifecycle to the app's own navigator. Routes are not discovered by
private React internals. Native device and upstream Bluesky acceptance remain
separate from the local web verification.

## Evidence

- Full release validation passed: 17 suites / 80 tests, boundaries, types, example
  smoke checks and package contents. Production web export retains dev guards.
- Live mapped/discovered navigation, snapshots after Back, focus after pan/zoom,
  active connectors, drawer reopening and element/source inspection verified.
- Details and screenshots: [Navigation flow evidence](../evidence/NAVIGATION_FLOW.md).
- Native device runtime and upstream Bluesky acceptance remain separate; native
  snapshots require the application capture callback.

Diagonal pan follow-up: replaced nested web scroll views with a single two-axis
viewport and verified +150px X / +100px Y from one real browser drag. Focus active
and app clicks still work. The follow-up passed 18 suites / 84 tests and release
checks; see the same evidence document.
