# Real production app: Bluesky

Upstream: https://github.com/bluesky-social/social-app

- Release: **1.100.0**
- Commit: **bf69672674cfff39e8796b60c9f37dc7f0c9d53a**
- License: MIT, preserved at `examples/upstream/bluesky/LICENSE`
- Baseline: Expo ~52.0.42, React 18.3.1, React Native 0.76.9

The checkout is a real production application, excluded from this workspace's
package discovery and Jest tests. The setup script checks its commit and refuses
to overwrite unrelated edits. Its source and license stay intact.

## Clone and prepare

```sh
yarn showcase:clone
yarn showcase:prepare
```

Preparation copies built Blueprint packages into the checkout's own
`node_modules`, then adds a lazy, development-only `?blueprint` entry under
Bluesky's existing `InnerApp` provider tree. No duplicate React installation or
cross-workspace symlink is introduced by preparation.

The harness mounts **actual upstream** Home, Search, Appearance Settings,
Accessibility Settings and Not Found screens. Each has an independent React
Navigation stack. The wrapper exposes the route and signed-in/out status through
`BlueprintInspectable`; arbitrary nested upstream component state is not exposed.
The active navigation route updates as the preview stack changes. Source labels
point to the corresponding upstream screen file.

Each preview overrides `react-responsive` through its [supported Context](https://github.com/yocontra/react-responsive#supplying-through-context) with
the current artboard dimensions (initially 390 × 844), so Bluesky's responsive hooks follow the Viewport controls. The upstream shell-layout provider is also local to each preview,
so measured header/footer heights are not shared across artboards. These adapters
are prepared from source and still need real-app build/runtime verification.

## Launch the actual app

From the checkout, use its pinned Yarn Classic toolchain:

```sh
cd examples/upstream/bluesky
corepack yarn install --frozen-lockfile --non-interactive
cd ../../..
yarn showcase:prepare
cd examples/upstream/bluesky
corepack yarn web --port 8082
```

Open `http://localhost:8082/?blueprint` in development. Normal URLs continue to
launch Bluesky's shell. The entry is gated by `__DEV__` and imported lazily.
The dependency installation executes upstream `prepare`/`postinstall` hooks,
including patch-package and locale compilation. Review and authorize those hooks
when your environment requires it. No credentials are needed for the logged-out
entry. Do not sign in or publish content just to demonstrate inspection.

## Limits

The original app services, query caches, preferences, theme and session are
shared by all artboards. Hooks that read global window dimensions and CSS media
queries still see the host window; the responsive override applies to
`react-responsive` consumers. Changing appearance can affect all previews. Refresh
resets the preview navigation/local state, not global providers. Some navigation
actions lead to routes outside the limited preview stack. Home/Search may fetch
public data using upstream services; these are not deterministic offline fixtures.
Native integration is not prepared by this web-only harness.

The main `/ide` showcase is an original offline social fixture app with 72 posts,
10 screen/state artboards and detailed component data. It does **not** claim to
render Bluesky source. Use the separate upstream harness to assess the real app.

Validation status is recorded in `docs/evidence/IDE_UPLIFT.md`.
