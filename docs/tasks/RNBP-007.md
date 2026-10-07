# RNBP-007: Expo Router discovery adapter

**Phase:** Expo Router

**Priority:** P1

**Status:** TODO

**Depends on:** RNBP-003, RNBP-006

## Objective

Provide optional Expo Router discovery that translates file-based routes into the common Blueprint manifest.

## Scope

- Discover routes under supported `app` and `src/app` layouts.
- Understand route groups and layouts.
- Ignore non-screen files and Blueprint's own integration entry.
- Map discovered routes to stable screen IDs and human-readable labels.
- Surface routes that require fixtures instead of silently failing.

## Acceptance criteria

- Static Expo Router screens appear in Blueprint without manual registration.
- Route groups do not leak into user-facing labels unless useful.
- Dynamic routes are identified and can be linked to explicit fixtures.
- Adapter output is the same common manifest consumed by manual registration.
- Core package has no Expo Router import after adapter installation.
- Tests cover representative Expo Router file structures.
