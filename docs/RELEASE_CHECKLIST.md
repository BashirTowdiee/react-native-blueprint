# Release checklist

## Before versioning

1. Start from a clean `main` checkout.
2. Run `yarn install --immutable`.
3. Run `yarn validate:release`.
4. Confirm the compatibility baseline in `docs/COMPATIBILITY.md` still matches
   the example projects.
5. Confirm package metadata, repository ownership and the intended licence before
   the first public npm release.

## Versioning

All Blueprint packages currently move together. Apply the same release version
to:

1. `@react-native-blueprint/core`
2. `@react-native-blueprint/react-native`
3. `@react-native-blueprint/expo-router`
4. `@react-native-blueprint/react-navigation`
5. `@react-native-blueprint/plugin-redux`
6. `@react-native-blueprint/plugin-tokens`

Update internal workspace dependency ranges as part of the same versioning
change and regenerate `yarn.lock`.

## Package verification

`yarn validate:packages` runs `npm pack --dry-run --json` for every package.
It rejects private packages, unexpected tarball files and exports whose built
targets are missing.

Review the resulting package sizes before a public release. Package tarballs are
expected to contain only `package.json` and `dist/**`.

## Publication order

Publish dependencies before dependants:

1. `@react-native-blueprint/core`
2. `@react-native-blueprint/react-native`
3. `@react-native-blueprint/expo-router`
4. `@react-native-blueprint/react-navigation`
5. `@react-native-blueprint/plugin-redux`
6. `@react-native-blueprint/plugin-tokens`

Use Yarn's npm publisher from each workspace so workspace protocol dependencies
are converted to release ranges:

```bash
yarn workspace @react-native-blueprint/core npm publish
yarn workspace @react-native-blueprint/react-native npm publish
yarn workspace @react-native-blueprint/expo-router npm publish
yarn workspace @react-native-blueprint/react-navigation npm publish
yarn workspace @react-native-blueprint/plugin-redux npm publish
yarn workspace @react-native-blueprint/plugin-tokens npm publish
```

After publication, install the released package versions into one Expo Router
fixture and one bare React Native fixture before creating the release tag.
