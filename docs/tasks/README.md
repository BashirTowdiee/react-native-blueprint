# Refactor Backlog

Status values: `TODO`, `IN PROGRESS`, `BLOCKED`, `DONE`.

| ID | Phase | Priority | Status | Ticket | Depends on |
| --- | --- | --- | --- | --- | --- |
| RNBP-001 | Foundation | P0 | DONE | Package/workspace boundaries and public API | - |
| RNBP-002 | Core | P0 | DONE | Extract Blueprint canvas and artboard primitives | RNBP-001 |
| RNBP-003 | Core | P0 | DONE | Screen manifest and registry API | RNBP-001, RNBP-002 |
| RNBP-004 | Core | P0 | DONE | Preview host and rendering boundary | RNBP-003 |
| RNBP-005 | Core | P0 | DONE | Remove Blueprint-specific application screen behaviour | RNBP-004 |
| RNBP-006 | Expo | P1 | DONE | Move prototype into Expo Router example app | RNBP-004 |
| RNBP-007 | Expo | P1 | DONE | Expo Router discovery adapter | RNBP-003, RNBP-006 |
| RNBP-008 | Expo | P1 | DONE | Dynamic route fixtures and variants | RNBP-007 |
| RNBP-009 | React Navigation | P1 | DONE | React Navigation static adapter | RNBP-003 |
| RNBP-010 | React Navigation | P1 | DONE | React Navigation dynamic registration | RNBP-003, RNBP-009 |
| RNBP-011 | Preview | P1 | DONE | Provider composition and preview context | RNBP-004 |
| RNBP-012 | Plugins | P2 | DONE | Extract Redux and design-token tooling | RNBP-001, RNBP-004 |
| RNBP-013 | UX | P2 | DONE | Blueprint canvas UX, devices and metadata | RNBP-002, RNBP-003 |
| RNBP-014 | Packaging | P1 | DONE | Development-only entry and production safeguards | RNBP-001, RNBP-006 |
| RNBP-015 | Release | P1 | DONE | Compatibility matrix, tests, docs and release readiness | RNBP-007, RNBP-010, RNBP-011, RNBP-014 |

## Immediate execution order

1. RNBP-002
2. RNBP-003
3. RNBP-004
4. RNBP-005

Do not start adapter automation before the explicit manifest/registry path works. Automatic discovery should build on the stable manual contract, not define it.

## IDE uplift

| ID | Priority | Status | Ticket |
| --- | --- | --- | --- |
| RNBP-016 | P1 | BLOCKED | [Inspection workbench and production-scale showcase](RNBP-016.md) — local implementation verified; upstream runtime awaits dependency installation approval |
| RNBP-017 | P1 | DONE | [All-screen previews and app navigation lifecycle](RNBP-017.md) — public API and local showcase verified in tests and browser |
| RNBP-018 | P1 | DONE | [Navigation flow canvas](RNBP-018.md) |
| RNBP-019 | P1 | DONE | [Source-first component selection](RNBP-019.md) |
| RNBP-020 | P1 | DONE | [Optional inspection sources and compact Details drawer](RNBP-020.md) — public contracts and live local web verified; native device validation separate |
