# Preview providers

Blueprint does not own application providers. Consumers supply provider wrappers to
`BlueprintPreviewHost`, so screens can receive the same Redux, theme, query,
localisation or other context they receive in the application.

## Composition

`providers.root` applies to every preview. A matching screen configuration is
then appended, followed by a matching variant configuration:

```text
root -> screen -> variant -> preview
```

Earlier wrappers are outermost. Screen and variant entries use `mode: 'append'`
by default. `mode: 'replace'` discards all wrappers accumulated before that
level. Reusing the same wrapper function at multiple levels mounts it only once.

```tsx
const providers = {
  root: [withTheme],
  screens: {
    profile: {
      wrappers: [withRedux],
      variants: {
        signedOut: {
          wrappers: [withSignedOutSession],
        },
      },
    },
  },
};

<BlueprintPreviewHost screen={screen} variant={variant} providers={providers} />;
```

Each wrapper receives `{ screen, variant }` as its second argument. Wrapper
render failures are handled by the preview error boundary, so a broken provider
does not take down sibling previews.

`wrapPreview` remains available for simple integrations. It runs after the
configured provider composition and therefore acts as the outermost legacy
wrapper.
