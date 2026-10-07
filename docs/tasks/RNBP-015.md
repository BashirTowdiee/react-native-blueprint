# RNBP-015: Compatibility matrix, tests, docs and release readiness

**Phase:** Release  
**Priority:** P1  
**Status:** TODO  
**Depends on:** RNBP-007, RNBP-010, RNBP-011, RNBP-014

## Objective

Make the refactored project suitable for external installation and iteration as a real package.

## Scope

- Define supported React Native, React, Expo Router and React Navigation ranges.
- Add CI/typecheck/test coverage for package boundaries.
- Add example smoke tests.
- Write installation and quick-start docs for Expo Router and bare React Native.
- Document explicit registry, fixtures, variants and provider wrappers.
- Validate package contents before publish.

## Acceptance criteria

- Compatibility matrix is explicit and tested against at least one supported Expo app and one bare RN app.
- Package tarballs contain only intended files.
- Quick starts use published/public APIs only.
- Core and adapters have automated tests for their critical contracts.
- Both examples pass typecheck and documented smoke validation.
- Release checklist exists with versioning and package publication order.
