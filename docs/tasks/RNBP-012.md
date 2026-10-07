# RNBP-012: Extract Redux and design-token tooling into optional plugins

**Phase:** Plugins

**Priority:** P2

**Status:** DONE

**Depends on:** RNBP-001, RNBP-004

## Objective

Preserve useful prototype tooling without making it part of Blueprint View's required dependency graph.

## Scope

- Move Redux state inspection behind an optional plugin API.
- Move design-token inspection/editing behind an optional plugin API.
- Remove token-server initialisation from the example's root rendering requirement.
- Define sidebar/tool contribution API only as far as needed by these plugins.
- Keep Blueprint usable with neither plugin installed.

## Acceptance criteria

- Base Blueprint package has no Redux dependency.
- Base Blueprint package has no token-server or Expo file-system dependency.
- Redux inspector works when explicitly configured with an application store/provider.
- Token plugin works through an explicit token source/update interface.
- Removing both plugins does not affect Blueprint canvas functionality.
