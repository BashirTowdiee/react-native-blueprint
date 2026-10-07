# RNBP-009: React Navigation static adapter

**Phase:** React Navigation

**Priority:** P1

**Status:** DONE

**Depends on:** RNBP-003

## Objective

Support bare React Native applications using React Navigation's statically inspectable configuration.

## Scope

- Translate supported static navigator configuration into Blueprint screens.
- Support common stack/tab nesting.
- Preserve useful navigator/screen labels as metadata.
- Keep navigation-specific logic inside the adapter package.

## Acceptance criteria

- A bare React Native example can render statically configured React Navigation screens in Blueprint.
- Nested navigator screens receive stable IDs.
- The adapter outputs the common Blueprint manifest.
- Core has no React Navigation dependency.
- Tests cover stack, tab and nested configurations.
