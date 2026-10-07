# Blueprint canvas

`BlueprintView` is the navigation-independent surface for browsing previews.

## Artboards and grouping

Artboards can be grouped with `groupId` and `groupLabel`. The navigation
examples use the screen ID as the group and place each fixture/variant inside
that group.

Each artboard can carry:

- `viewport`: manifest-derived width, height and optional name.
- `metadata`: adapter or application metadata shown in the selection inspector.
- `groupId` / `groupLabel`: visual grouping for screen variants.

Selecting an artboard focuses it and opens the metadata inspector. The nested
scroll views provide canvas panning. Zoom controls support bounded zooming and a
Reset action restores the configured initial zoom and default selection.

## Viewports

`BLUEPRINT_DEVICE_PRESETS` provides compact phone, standard phone and tablet
presets. `createBlueprintViewportFromPreset()` converts a preset to the common
`BlueprintViewport` shape.

Custom dimensions use the same shape and do not need to match a preset:

```tsx
{
  id: 'checkout:wide',
  label: 'Wide checkout',
  viewport: {
    name: 'Custom QA viewport',
    width: 430,
    height: 932,
  },
  content: <CheckoutPreview />,
}
```

Manifest/variant viewport values should be passed through directly so the size
shown by the canvas matches the preview contract rather than a navigation
adapter-specific assumption.
