# Component source and selection verification — 2026-10-08

Verified in the Open Social Expo web preview at `/ide` on port 8093.

## Runtime evidence

- Header contains the three mode buttons and Pick component. Screens/Details
  header toggles are absent; drawer chevrons and edge reopen tabs remain.
- Closing Details then enabling Pick component reopens it on Components. Picking
  Show empty state does not navigate; Settings remains active. The source card
  shows SettingsPanel and `SocialApp.tsx:544:15`, with Copy file path/Copy location.
- The matching SettingsPanel row scrolls into view and shows SELECTED. Its picked
  element has a persistent green outline. Raw DOM/data/saved-comparison sections
  do not appear automatically in Components.
- With picking off, selecting ScreenHeader in the drawer keeps Components open,
  changes the source to `SocialApp.tsx:250:7` and outlines that preview region.
- The web list contains the five visible Settings regions while Feed remains
  retained by the real navigator. Public DOM visibility filters the list without
  deleting registrations or resetting the retained screen.
- Picking the app Back control keeps Settings active and shows SocialRoute at
  `SocialNavigationApp.tsx:39:5`. Flow navigation chrome has its own FlowRoute
  source registration. All fixture content has a screen source boundary.
- Data offers Save data for comparison, Update saved data and Clear saved data.
  Saving unchanged values shows 0 changed fields and No changes since saving
  this data. Returning to Components hides those advanced data tools.
- Screenshot: `ide-component-source.jpg` shows the simplified header, selected
  SettingsPanel source card, preview outline and corresponding highlighted row.

## Validation and boundaries

`npm_config_cache=/private/tmp/rnbp-cleanup-npm-cache yarn validate:release`
passed package boundaries, builds/types, 19 suites / 91 tests, example smoke
checks and package tarball checks. Tests cover header/picker/list synchronization,
copying file/location, selection styling cleanup, hidden/retained regions, native
source boundaries that do not cover child targets, and current JSX source metadata.

Production web export passed. The Babel source plugin is disabled in production;
exported bundles contain no generated showcase sourceLocation objects. The example
plugin respects explicit locations and import aliases, and excludes external files.

Locations point to the explicit inspection registration in its source file, rather
than claiming an inferred leaf expression, component definition or hook tree.
Editor opening remains app-owned through onOpenSource. Native picking supports
registered regions; native-device runtime and upstream Bluesky acceptance are
separate from this local browser evidence.
