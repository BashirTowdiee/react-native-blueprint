# RNBP-005: Remove Blueprint-specific application screen behaviour

**Phase:** Core  
**Priority:** P0  
**Status:** TODO  
**Depends on:** RNBP-004

## Objective

Remove the current requirement for application screens to know when they are being rendered in Blueprint.

## Scope

- Remove `designing` props from demo screens.
- Replace preview-time navigation suppression with preview-host/navigation abstractions.
- Ensure screen event handlers remain normal application code.
- Add fixtures where route params or state are required.

## Acceptance criteria

- No demo screen accepts a `designing` or Blueprint-specific prop.
- Normal app navigation behaviour remains unchanged outside Blueprint.
- Previewing a screen does not unexpectedly navigate the host application.
- Screens with route dependencies can be rendered through fixtures/context.
- Search of application code finds no Blueprint-specific conditional behaviour.
