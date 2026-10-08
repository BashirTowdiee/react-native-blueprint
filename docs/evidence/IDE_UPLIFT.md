# IDE uplift validation — 8 October 2026

## Verified implementation

- Searchable screen/variant navigator; names, metadata, component names and exposed data values.
- Focus preserves mounted preview state; canvas chrome and panel controls are outside profiled screens.
- Opt-in component picking, source labels, live exposed data and component search.
- Structured copy reports, selectable/manual fallback, common secret-field redaction and bounded valid JSON exports.
- Per-preview React commit/render metrics and remount refresh with refresh counts.
- Declared viewport dimensions now match content size before canvas zoom.
- Responsive panel collapse/overlays. The original Expo demo was selectable at
  this validation checkpoint; it was subsequently removed from the workbench.
- Open Social fixture showcase: 72 posts, six authors, seven screens, ten screen/state artboards.
- Expo discovery filters excluded IDE/layout/special modules before evaluating them.

## Automated validation

`npm_config_cache=/tmp/blueprint-npm-cache yarn validate:release` passed:

- Package dependency boundaries.
- Builds and package/example typechecks.
- **15 suites, 54 tests**, one snapshot.
- Both example public API/development guard smoke checks.
- All six package tarball contents and entry targets.

`git diff --check` passed. The temporary npm cache avoids the sandbox's lack of
write access to the default cache; no global cache permissions were changed.

## Live browser evidence

The existing Expo server at `http://localhost:8081/ide` served the rebuilt packages.
Browser checks used the Codex in-app browser after Playwright CLI's configured
Chrome executable was unavailable.

- Inspect a post: `PostCard`, its source label and JSON data appear.
- Disable Inspect and like the post: `likes: 24` becomes `25`, `liked` becomes true.
- Copy report: clipboard JSON contains `PostCard` and the updated post data.
- Search `PostCard`: four matching previews returned.
- Error fixture Retry: the ready feed replaces the offline state.
- Refresh: likes reset to 24; the Activity tab shows refresh count 1 and a fresh render count.
- Content dimensions measured from rendered DOM: **390 × 844** before scaling.
- Composer: entering text and publishing locally increases its preview dataset to 73 posts; other previews keep their separate fixture state.
- Narrow viewport: panels collapse and the navigator can reopen as an overlay.
- Fresh reloads after the nesting/discovery repairs did not add new console warnings/errors; earlier entries remain in the browser's accumulated log.

Screenshot: [live inspection](ide-inspection.jpg).

## Real production app

Cloned the MIT-licensed Bluesky app at release **1.100.0**, commit
`bf69672674cfff39e8796b60c9f37dc7f0c9d53a`, into
`examples/upstream/bluesky` (76 MB with source). The clone is ignored by the parent
repository and reproducible through `yarn showcase:clone`; its upstream license
is preserved.

The setup script prepared a development-only web `?blueprint` harness under the
upstream provider tree using actual Home, Search, Appearance Settings,
Accessibility Settings and Not Found screens. Preparation is idempotent and
refuses unrelated checkout changes or edits to its generated harness. Built
Blueprint packages are copied rather than linked to avoid duplicate React.

**Not verified:** upstream dependency installation, harness typecheck/build/live
runtime, or native device behavior. Automatic approval review rejected dependency
installation because it fetches a large third-party dependency tree and executes
upstream lifecycle scripts. User approval was requested and is pending.

The original offline Open Social app is not Bluesky source. Root release checks
exclude the external checkout and do not qualify its runtime.

## Remaining acceptance

Approve and run upstream dependency installation, prepare again, launch the real
Bluesky harness and resolve any integration failures discovered there. Native
inspection/clipboard behavior needs a separate device run if native qualification
is required.


## Second workshop and implementation

Added a bounded component-data history, pinned snapshot comparisons,
component-only JSON exports, and selected-artboard viewport presets/rotation.
Public `useBlueprintPreviewViewport` lets app-owned preview providers adapt to
those dimensions. The prepared Bluesky harness uses it for responsive context,
isolates shell-layout measurements, and exposes the current navigation route and
source label. Its actual runtime remains unverified pending installation approval.

Live browser verification:

- A pinned PostCard baseline reports `/post/liked: false → true` and
  `/post/likes: 24 → 25` after a like.
- The Changes tab records the same two fields. Clear history removes them without
  changing live data or render state.
- Tablet rotation produces a measured **1024 × 768** content area, preserving the
  liked post. Restoring the fixture returns to **390 × 844**.
- A pinned baseline also survives viewport rotation/restoration.
- Snapshot replacement changes the baseline while subsequent interactions keep
  updating the live comparison.
- Component-only copy reports success in the UI. The in-app browser automation
  clipboard accessor retained an earlier report, so current component-only payload
  verification is qualified in that environment. Tests verify the exact payload
  through both the default web clipboard branch and the injected native callback.

Additional automated coverage checks nested additions/removals, JSON Pointer
escaping, bounded diff/history output, redaction before history capture, baseline
exports, viewport context and state preservation. The full release validation
passed after these additions; no upstream dependency scripts were executed.

Screenshots: [snapshot comparison](ide-snapshot-comparison.jpg),
[change history](ide-change-history.jpg).


## Blocked audit

The dependency-install approval blocker persisted across three consecutive goal
turns. Current resolution checks confirm `@atproto/api` and `@lingui/react` are
unavailable in the pinned checkout, while the prepared Blueprint renderer resolves
to its copied build. No install process was started after the approval rejection.
All independent IDE/showcase implementation and validation work is complete;
real-app build/runtime acceptance requires user approval for that installation.
The goal and RNBP-016 are marked BLOCKED, not complete.

## Original Expo demo removal — 8 October 2026

Removed the Japanese-study routes, Expo starter components/assets, navigation
helpers, Redux persistence, token-server fixtures and original-demo switcher
(42 demo files). The Expo host now mounts Open Social directly from its explicit
manifest without application-level providers. Unused demo dependencies and alias
configuration were removed, and the Yarn lockfile was regenerated offline.

Validation:

- Offline immutable dependency installation passed with lifecycle builds skipped.
- Package boundaries, package/example typechecks, all 13 Jest suites (52 tests)
  and example smoke checks passed.
- Package-content checks passed with `npm_config_cache` pointed to a temporary
  writable cache; the default host cache was blocked by the filesystem sandbox.
- Production web export passed. Its routes contain the workbench, root, sitemap
  and not-found pages, with no login, story, passage, study or explore routes.
- Live development browser: `/` redirects to `/ide`, all 10 social previews are
  listed, and no original-example switcher is present. A feed like changed from
  24 to 25. `/login` displays the not-found page; its home link returns to `/ide`.
- The verified browser tab reported no warning/error console entries.

Screenshot: [Open Social workbench after removal](ide-social-only.jpg).
This check does not change the separate upstream Bluesky acceptance gap above.

## Workspace mounting modes — 8 October 2026

`BlueprintWorkspace` now defaults to **Navigation**: one application root with an
app-owned navigator and providers. Its observer reports the active route without
mounting fixtures or remounting that root. **All screens** retains the existing
behavior of mounting every registered fixture, including focused/hidden ones.
Changing modes disposes the previous session. Navigation's refresh control is
explicitly labelled **Restart app**.

Open Social uses a real independent React Navigation native stack in Navigation
mode. The app provider shares posts between visited routes. Region IDs include
the navigator route key so retained screens do not overwrite one another's
inspection data.

Automated validation:

- `yarn validate:release` passed with a writable temporary npm cache: package
  boundaries, builds/typechecks, 14 Jest suites (58 tests), example smoke and
  tarball/export checks.
- Six workspace tests cover lazy app-owned screen mounting, app-controlled
  retention, cleanup when switching modes, controlled selection, redacted route
  reports, restart and state preservation during viewport/inspection changes.
- Production web export passed; the production root displays the development-only
  fallback, and Blueprint remains guarded at `/ide`.

Live browser checks:

- Initial Feed has 10 inspection regions and no Search/composer fixtures.
- Navigating to Search adds its 11 regions. The native stack keeps Feed mounted.
  Back removes Search's regions (21 returns to 10) while the liked post stays 25.
- Posting from Compose returns to Feed with 73 posts and the earlier like intact.
- Settings routes to Feed with an error fixture parameter. Restart app resets the
  stack/provider to Feed, 72 posts and the initial 24 likes.
- All screens renders 10 artboards. Returning to Navigation renders one app
  artboard, a fresh Feed and the Restart app action.
- No application errors were reported. The browser log retained a Metro disconnect
  warning from deliberately stopping/restarting the development preview.

Screenshots: [Navigation mode](ide-navigation-mode.jpg),
[All screens mode](ide-all-screens-mode.jpg).

These checks qualify the local web showcase and public mounting contract. Native
device behavior, upstream Bluesky runtime and production-performance measurements
remain outside this verification.
