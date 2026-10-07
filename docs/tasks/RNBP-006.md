# RNBP-006: Move prototype into Expo Router example app

**Phase:** Expo Router  
**Priority:** P1  
**Status:** TODO  
**Depends on:** RNBP-004

## Objective

Turn the current application into a consumer example instead of the implementation host.

## Scope

- Create `examples/expo-router`.
- Move the existing demo routes/screens/state/design system into the example.
- Replace duplicate `app/ide.tsx` and `app/(ide)/index.tsx` implementations with one example integration.
- Consume Blueprint through package exports.

## Acceptance criteria

- Example app runs through Expo Router.
- Example imports Blueprint only through public package APIs.
- Only one Blueprint entry route exists in the example.
- Publishable packages contain no Japanese-study demo application logic.
- Example remains useful for visual/manual acceptance testing.
