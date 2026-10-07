# RNBP-008: Dynamic route fixtures and variants

**Phase:** Expo Router

**Priority:** P1

**Status:** TODO

**Depends on:** RNBP-007

## Objective

Make dynamic screens deterministic and useful in Blueprint through named fixtures and visual variants.

## Scope

- Allow params for routes such as `[id]`.
- Allow multiple named variants for one screen.
- Support fixture data/context associated with a variant.
- Display variant labels and route-param metadata in Blueprint.
- Define behaviour when required params are missing.

## Acceptance criteria

- One dynamic route can render multiple named preview variants.
- Route params are deterministic and visible in metadata.
- Missing required fixtures produce an actionable state rather than a crash.
- Variants work through the common manifest contract, not an Expo-only core API.
- Tests cover dynamic segments and multiple variants.
