# RNBP-004: Preview host and rendering boundary

**Phase:** Core

**Priority:** P0

**Status:** TODO

**Depends on:** RNBP-003

## Objective

Render application screens inside Blueprint without coupling the screen implementation to Blueprint.

## Scope

- Define a preview renderer/host interface.
- Isolate errors per artboard so one broken preview does not take down the canvas.
- Define loading and unsupported-preview states.
- Allow adapter-specific preview hosts without changing Blueprint Core.
- Support optional wrappers around individual previews.

## Acceptance criteria

- A normal React Native component can be previewed without a Blueprint-only prop.
- Preview failures are isolated and identify the affected screen.
- Core consumes the common preview contract rather than navigation-library APIs.
- Preview rendering can be replaced by an adapter implementation.
- Tests cover successful, loading and failed preview states.
