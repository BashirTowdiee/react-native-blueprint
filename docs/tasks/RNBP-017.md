# RNBP-017 — All-screen previews and app navigation lifecycle

Status: DONE (public contract and local showcase verified in tests and browser)

## Outcome

Developers choose between mounting all preview fixtures and following one app's
normal navigator lifecycle. Navigation mode observes the app instead of eagerly
mounting every registered screen.

## Acceptance criteria

- Public, navigation-independent workspace API supports both modes.
- Navigation mode mounts one app root and no fixture artboards; the app's
  navigator controls screen mounting, retention and removal.
- Route reports, inspection and viewport changes preserve the app instance.
- All screens mounts every fixture, including hidden/focused previews.
- Switching modes disposes the previous session; restart/reset behavior is clear.
- The social showcase exercises a real app-owned navigation stack with shared
  app data, initial/changed route reporting and working back navigation.
- Tests check mounting/cleanup, navigator retention, mode switching, route report
  redaction and explicit restart. Package/example checks and live browser evidence
  validate the public integration.

## Scope boundary

This work qualifies the local Open Social showcase and public workspace contract.
It does not resolve the separate upstream Bluesky dependency/runtime gap in
RNBP-016, or claim native-device or production-performance acceptance.

## Evidence

- `yarn validate:release` passed with a writable temporary npm cache: package
  boundaries, builds/typechecks, 14 Jest suites (58 tests), example smoke checks
  and package tarball checks.
- Production web export passed with the development route guard retained.
- Browser: initial Feed registers 10 inspection regions; visiting Search adds 11
  while the stack retains Feed, and Back removes Search's regions. Feed's liked
  post remains at 25 across navigation/back.
- Composer publication returns to Feed with 73 shared posts; Settings can navigate
  to an error fixture; Restart app returns to Feed with 72 posts and 24 likes.
- All screens exposes 10 fixture artboards. Returning to Navigation exposes one
  app artboard and starts a fresh session.
- Screenshots and limitations are recorded in `docs/evidence/IDE_UPLIFT.md`.
