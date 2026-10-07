# RNBP-010: React Navigation dynamic registration

**Phase:** React Navigation

**Priority:** P1

**Status:** DONE

**Depends on:** RNBP-003, RNBP-009

## Objective

Support React Navigation applications whose runtime/dynamic navigator structure cannot be safely discovered.

## Scope

- Document and implement explicit `registerBlueprintScreens` integration.
- Provide React Navigation helpers for route params and preview navigation context.
- Avoid brittle runtime introspection of arbitrary navigator trees.
- Allow automatic static discovery and manual registration to coexist.

## Acceptance criteria

- Dynamically configured apps can register screens without changing screen components.
- Manual registration can supplement or override discovered metadata predictably.
- No private React Navigation internals are required.
- Bare RN example demonstrates the explicit registration path.
- Tests cover registration plus navigation context.
