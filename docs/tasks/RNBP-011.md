# RNBP-011: Provider composition and preview context

**Phase:** Preview

**Priority:** P1

**Status:** TODO

**Depends on:** RNBP-004

## Objective

Allow previews to receive the same required app context as normal screens without Blueprint owning those dependencies.

## Scope

- Add root preview wrapper/provider API.
- Add optional per-screen/per-variant wrappers.
- Support arbitrary user providers such as Redux, theme, query clients and localisation.
- Define provider composition order.
- Avoid double-mounting providers unnecessarily.

## Acceptance criteria

- Consumers can preview a screen requiring Redux without Blueprint importing Redux.
- Consumers can compose multiple providers in a documented order.
- Screen-specific wrapper configuration overrides/extends root configuration predictably.
- Provider failures are surfaced per preview where practical.
- Tests cover global and per-screen wrapper composition.
