# RNBP-003: Screen manifest and registry API

**Phase:** Core  
**Priority:** P0  
**Status:** TODO  
**Depends on:** RNBP-001, RNBP-002

## Objective

Define the navigation-independent contract used to describe screens, route fixtures and variants to Blueprint.

## Scope

- Define `BlueprintScreen`, `BlueprintVariant` and viewport metadata.
- Add an explicit `registerBlueprintScreens` path.
- Support stable IDs independent of route-library internals.
- Define metadata for labels, grouping and optional route information.
- Define validation and duplicate-ID behaviour.

## Acceptance criteria

- Blueprint can render screens supplied only through the common registry.
- Registry works without Expo Router or React Navigation installed.
- Duplicate/invalid registrations fail predictably with actionable errors.
- Manifest types are exported as public API.
- Registry ordering is deterministic.
- Tests cover registration, validation, ordering and replacement/update semantics.
