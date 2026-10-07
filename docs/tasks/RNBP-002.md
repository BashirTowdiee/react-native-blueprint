# RNBP-002: Extract Blueprint canvas and artboard primitives

**Phase:** Core

**Priority:** P0

**Status:** DONE

**Depends on:** RNBP-001

## Objective

Extract the Blueprint canvas from the Expo Router IDE route into reusable React Native components.

## Scope

- Extract canvas/workspace container.
- Extract artboard/screen frame.
- Extract pan/zoom state and controls.
- Support multiple artboards from data instead of hard-coded JSX.
- Preserve web usability while keeping the component React Native compatible.
- Remove styling dependencies on the demo design system.

## Acceptance criteria

- `BlueprintView` can render an array of generic artboards.
- Canvas code does not import demo application screens.
- Canvas code does not import Expo Router, Redux or token tooling.
- Zoom behaviour is owned by Blueprint rather than the demo route.
- Artboard dimensions and labels are data-driven.
- Unit/component tests cover basic artboard rendering and zoom bounds.
