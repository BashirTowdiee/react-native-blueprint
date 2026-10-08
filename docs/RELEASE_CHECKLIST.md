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

All Blueprint packages move together. Set and verify their version with:

```sh
yarn release:version 0.2.0-dev.1
yarn install
yarn release:version:check
yarn validate:release
```

The version command updates the public `BLUEPRINT_VERSION` constant and all six
package manifests. Internal dependencies retain `workspace:*`; Yarn rewrites them
to the coordinated version when packing. The packages are:

1. `@react-native-blueprint/core`
2. `@react-native-blueprint/react-native`
3. `@react-native-blueprint/expo-router`
4. `@react-native-blueprint/react-navigation`
5. `@react-native-blueprint/plugin-redux`
6. `@react-native-blueprint/plugin-tokens`

Commit the versioned, validated source before packing. Create immutable archives
and their source commit/checksum manifest with `yarn release:pack`. Output defaults
to ignored `releases/<version>/`; an explicit output directory may be supplied.
The packer requires a clean Git tree and refuses to overwrite archives. Consumers
should keep the tarballs at stable, versioned paths and pin the matching core
dependency via their package manager's override when using local archives.

Local packaging does not publish packages or create remote Git tags. The Settings
view shows `BLUEPRINT_VERSION`; consumers can supply `inspection.release` from
the release manifest to display its source commit and channel.

## Package verification

`yarn validate:packages` runs `npm pack --dry-run --json` for every package.
It rejects private packages, unexpected tarball files and exports whose built
targets are missing.

Review the resulting package sizes before a public release. Package tarballs are
expected to contain `package.json`, `dist/**` and the renderer's explicitly
allow-listed public Babel/DevTools/development forwarding files. Examples and
upstream checkout files are excluded and release packing checks that boundary.

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
