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
| RNBP-008 | Expo | P1 | TODO | Dynamic route fixtures and variants | RNBP-007 |
| RNBP-009 | React Navigation | P1 | TODO | React Navigation static adapter | RNBP-003 |
| RNBP-010 | React Navigation | P1 | TODO | React Navigation dynamic registration | RNBP-003, RNBP-009 |
| RNBP-011 | Preview | P1 | TODO | Provider composition and preview context | RNBP-004 |
| RNBP-012 | Plugins | P2 | TODO | Extract Redux and design-token tooling | RNBP-001, RNBP-004 |
| RNBP-013 | UX | P2 | TODO | Blueprint canvas UX, devices and metadata | RNBP-002, RNBP-003 |
| RNBP-014 | Packaging | P1 | TODO | Development-only entry and production safeguards | RNBP-001, RNBP-006 |
| RNBP-015 | Release | P1 | TODO | Compatibility matrix, tests, docs and release readiness | RNBP-007, RNBP-010, RNBP-011, RNBP-014 |

## Immediate execution order

1. RNBP-002
2. RNBP-003
3. RNBP-004
4. RNBP-005

Do not start adapter automation before the explicit manifest/registry path works. Automatic discovery should build on the stable manual contract, not define it.
