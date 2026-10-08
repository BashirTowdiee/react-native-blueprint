# RNBP-019 — Source-first component selection

Status: DONE (local browser and public contracts verified)

## Outcome

Picking an element opens a named component and source file instead of a generic
DOM tag and empty child/data sections. The header picker, Components list and
preview share one selection. Remove duplicate Screens/Details header toggles.

## Acceptance criteria

- Pick component opens Components, and canvas picks select/scroll to the owning
  component row. Selecting a row highlights the matching preview region and keeps
  the list open. Selection persists after picking is disabled.
- A source card leads with component, file and supplied line/column, with copy
  actions. Every Open Social region receives current development-only source
  metadata from its actual JSX registration; no fabricated source positions.
- Web lists components from visible navigator screens while preserving retained
  screen registrations and state. Parent-source fallback is labeled explicitly.
- DOM tree details are optional. Raw values/comparison tools stay in Data with
  plain Save/Update/Clear saved-data labels and an explanation of comparisons.
- Screens/Details header buttons are removed; heading collapse and edge reopen
  tabs remain functional. Picking still opens the drawer directly.
- Focused selection/source/visibility tests, package/example checks and browser
  evidence cover SettingsPanel and both directions of selection. Production
  export retains its route guards and excludes automatic source instrumentation.

## Scope

Source metadata identifies explicit inspection registrations. It does not infer
private React component/hook trees or exact leaf expressions. Native picking
uses registered regions; native-device acceptance remains separate.

## Evidence

- Release validation passed: 19 suites / 91 tests, boundaries, types, examples
  and package exports. Production export retains guards and excludes generated
  source annotations.
- Browser verified SettingsPanel file/line, both selection directions, hidden
  screen filtering, header cleanup and plain saved-data comparison labels.
- [Component source evidence](../evidence/COMPONENT_SOURCE.md) includes the
  screenshot and platform/source-location boundaries.
