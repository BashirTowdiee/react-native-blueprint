# RNBP-020 — Optional wrappers and inspection sources

Status: DONE — public contracts and local web acceptance; native device validation remains separate

User request: implement automatic source instrumentation, external config
mappings and official React DevTools integration. Leave one screen wrapped and
show which approaches supply element data in a configs/settings view.

Acceptance:
- Package a development compiler plugin; source and refs work without hand-written wrappers.
- External mappings match existing IDs/labels, override metadata and clean up on unmount.
- Official React DevTools presents the real tree and hooks in a companion, without private Fiber access in Blueprint.
- Keep SettingsPanel as the only wrapped showcase example.
- Settings and selected-element cards show provenance and connection status.
- Details uses one compact navigation strip, a single heading, scoped actions and a compact source summary; screen metadata and setup explanations disclose on demand.
- Verify package exports, types, tests, production exclusion and live web behavior.
- Record native public-ref contract coverage separately from native-device acceptance.

Implementation and acceptance evidence: `../evidence/OPTIONAL_INSPECTION.md`.
