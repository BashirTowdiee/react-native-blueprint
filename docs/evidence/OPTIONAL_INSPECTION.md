# Optional inspection sources and compact Details drawer

Verified locally on 2026-10-08 in the Expo web showcase at `/ide`.

## Implementation

- The public development Babel plugin supplies exact JSX file, line and column,
  component names and nested host registrations. It forwards refs and renders
  the original host without adding layout views. Production and excluded folders
  remain uninstrumented. It introduces a development React component layer.
- External config rules match existing IDs, accessibility labels and compiler
  metadata. Rules override names, optional source and deliberate application data.
  Web config-only matching works without the compiler; registrations clean up on
  unmount. Public metadata does not copy input values or arbitrary hook state.
- The official React DevTools backend connects before the renderer. Its companion
  displays the actual React tree, props and hooks. Blueprint only reports transport
  status and opens the companion. Window sessions isolate multiple previews;
  readiness and reconnect guards prevent stale bridge messages.
- SettingsPanel is the only hand-written `BlueprintInspectable` example. All
  other showcase wrappers were removed. Settings reports source counts/status;
  selected elements show automatic, config or wrapped provenance.
- Details now has a single title and six-item compact navigation strip. Element
  source information is a small summary, with text actions for file/location.
  Screen metadata and setup explanations disclose on demand. Copy report and
  restart live within Data's Preview actions, below inspection content.

## Automated validation

`npm_config_cache=/private/tmp/rnbp-cleanup-npm-cache yarn validate:release`
passed: boundaries, all package/example typechecks and builds, **21 suites / 98
tests**, example smoke checks and every package tarball/export check.

Tests include compiler positions and aliases, exactly one example wrapper,
native public ref forwarding without extra host views, nested registration,
serialization/redaction, existing DOM config matching/removal, selection and
source actions, and official messaging readiness/reconnection/disposal.

Final production Expo web export succeeded at
`/private/tmp/rnbp-optional-inspection-export-verified`. Its bundle excludes
showcase compiler source annotations, the companion readiness message, official
custom messaging backend API, our connection singleton and session-storage key.
The public SourceElement implementation remains in Metro's package module, so
its parameter names alone are not evidence of production instrumentation.
The existing development-only route guards remain covered by smoke checks.

## Live browser evidence

- [Compact empty Data view](ide-details-compact.jpg): one heading and one tab strip,
  collapsed Screen info and contextual Preview actions.
- [Unwrapped Search input](ide-automatic-inspection.jpg): picking selected the
  configured Search input, highlighted the canvas and exposed
  `SocialApp.tsx:402:21`, with Automatic metadata + Config mapping provenance.
- [Inspection Settings](ide-inspection-sources.jpg): connected official companion,
  mounted automatic/config counts and exactly one wrapped custom data region
  while the Settings screen was open. Counts include retained mounted navigator
  screens; the Elements list filters invisible retained screens.
- [Official React tree](ide-react-devtools.jpg): unwrapped SocialScreen selected
  in the official UI, with its props, State/Context/Effect/Memo hooks, rendered-by
  chain and source. These values remain in React DevTools.
- SettingsPanel remained selectable and exposed its deliberate fixture/theme/
  storage/network data with Wrapped example provenance.
- Drawer collapse, persistent reopening, app navigation and picking after collapse
  were verified in the actual narrow 501 × 712 browser. A temporary viewport
  override was attempted for desktop coverage, but the in-app browser retained
  its actual dimensions; the override was reset. Desktop split-layout acceptance
  was not established by that attempt.

## Limits

Native measurement/ref behavior has contract tests, **not native-device acceptance**.
Uninstrumented native third-party views require an adapter or native React
DevTools. The full React tree is intentionally available in the official companion;
Blueprint's hierarchy represents registered host elements and optional regions.
The separate upstream Bluesky runtime blocker in RNBP-016 remains unchanged.
