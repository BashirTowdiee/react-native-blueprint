# Navigation flow and workbench verification — 2026-10-08

Verified against the local Open Social Expo `/ide` preview on port 8093.

## Runtime evidence

- Mapped starts with Feed live and six inert route placeholders. Unvisited routes
  show zero inspection regions and zero commits. Depth columns and peer rows
  match the app-owned map. Discovery starts with just Feed and builds routes
  through actual app navigation buttons.
- Feed → Search → Thread mounts the live branch. Back removes Thread's regions,
  keeps its placeholder, and returns focus to Search. Branch replacement removes
  descendants. Shared Feed likes survive navigating and returning.
- Every transition centers its destination, with readable device framing. The
  green pulse moves along its connector; the thicker highlight remains after the
  pulse. Geometry tests cover paths skipping columns and same-column/back paths
  avoiding every frame.
- A single 52px header holds modes and controls. Closing both drawers expands the
  canvas and exposes labeled Screens/Details edge tabs. Reopening preserves the
  liked post at 25. Narrow headers scroll horizontally.
- Picking the real Open thread button leaves the app on Feed. Details shows its
  nearest PostCard registration and source file, and marks the line unknown.
  Inspect parent element moves from the clicked text leaf to the button and
  exposes rendered children. Copy file path reports success. Automated clipboard
  and source callback tests check exact copied paths and supplied line/column.
- Search with query `design` is captured before Back. The placeholder contains a
  loaded 390 × 844 PNG with that query, dimming and Last view · Unmounted badge.
  Search has zero live regions. Revisiting removes the image, mounts a fresh
  Search screen with an empty query, and leaving again updates the last image.
- Fit exposes Focus active; clicking it restores the active screen zoom/center
  and hides the button. Panning away also exposes it; refocusing works at the
  same zoom. The final frame center is within 1px horizontally and 9px vertically
  of the workspace center (the hierarchy box also includes its heading).

## Artifacts

- `ide-flow-mapped.jpg`: mapped flow, live/placeholder frame styling and connectors.
- `ide-drawer-tabs.jpg`: both drawers closed with persistent reopen controls.
- `ide-element-inspection.jpg`: picked button, file copy, parent and rendered children.
- `ide-flow-snapshot.jpg`: dimmed Search image after Back and Focus active control.

## Automated validation and limits

`npm_config_cache=/private/tmp/rnbp-cleanup-npm-cache yarn validate:release` passed:
package boundaries, builds/types, 17 suites / 80 tests, example smoke checks and
package tarball exports. Production web export passed with development route guards.
Tests cover capture-before-unmount, image replacement, capture failure/timeout,
focus after pan/zoom, DOM picking suppression, bounded child trees and cleanup.

This is browser and public-contract evidence. Native view capture needs the
app-owned `captureScreen` callback and native picking uses registered regions.
Neither native-device runtime nor the separate upstream Bluesky integration is
qualified by this evidence. Web DOM image capture can need a custom capture
adapter for cross-origin media, web fonts, video/iframes or unsupported browsers.

## Diagonal pan follow-up — 2026-10-08

The web canvas now uses one scroll node instead of nested one-axis nodes. Its
computed overflow is `auto` on both axes. A single background mouse drag from
(380,420) to (230,320) changed offsets from (160,1616) to (310,1716): +150px X
and +100px Y in the same gesture. Focus active appeared afterward and restored
(160,1616). The real Feed like button still changed from 24 to 25 normally.
Screenshot: `ide-diagonal-pan.jpg`. Native background touch panning is implemented;
this follow-up does not claim native-device gesture acceptance.

Release validation passed with 18 suites / 84 tests, including combined web
camera updates, mouse diagonal deltas, cancellation/cleanup and preserving app
controls. Browser scrollbars retain their normal gestures. Package builds/types,
example smoke checks and tarball exports passed.
