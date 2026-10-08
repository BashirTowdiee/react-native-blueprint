# Working in React Native Blueprint

This is a Yarn workspace for development-only React Native screen previews and
inspection. Publishable code lives in `packages/`; consumer apps and fixtures
live in `examples/`. Use `CODEMAP.yml` to find entry points, tests and guides.

## Start here

- Read `README.md`, `CODEMAP.yml` and the documentation relevant to the change.
- Check `git status --short` before editing. Preserve unrelated local changes,
  untracked work, evidence and upstream checkout edits.
- For backlog work, read `docs/tasks/README.md` and the selected ticket. Use the
  ticket's acceptance criteria and dependencies to determine scope. The refactor
  plan records historical intent; verify paths and status against current code.
- Keep `CODEMAP.yml` current when moving entry points, changing package
  responsibilities or adding validation commands.

## Architecture and public APIs

- `core` owns screen/variant/viewport types, the registry and preview/plugin
  contracts. Keep it independent of React Native rendering, Expo, Expo Router,
  React Navigation, Redux and React Redux.
- Each other Blueprint package may depend internally on `core` only. Keep
  navigation adapters independent of one another and plugins optional.
- Put canvas, artboard, preview rendering and inspection UI in `react-native`.
  Keep app-specific screens, stores, fixtures and token persistence in examples
  or app-owned providers. Packages must not import example code.
- Examples consume package exports. Do not introduce `/src/` or `/dist/` deep
  imports. Expose supported APIs through `src/index.ts` and `package.json`.
  The React Native `./dev` entry exposes development guards; retain its root
  `dev.js` and `dev.d.ts` forwarding files for consumer resolution.
- Preserve development-only mounting/registration and production route guards.
  Tree-shaking alone does not prevent access to a file-based route.
- Use explicit fixtures and provider composition for previews. Viewport context
  does not simulate global Dimensions, browser media queries or native APIs.
- Preserve the distinction between `BlueprintWorkspace` modes: All screens mounts
  fixtures; Navigation hosts one app root and delegates screen lifecycle to its
  navigator. Observe routes without remounting that root. Mode changes dispose
  the previous session, and Restart app explicitly resets its mounted tree.
- Navigation flow uses an explicit app-supplied navigation adapter: mount only
  the active branch, retain placeholders after back, and route connectors outside
  every screen frame. Do not replace normal Navigation mode's lifecycle with
  the flow preview's mounting policy. Keep controls in the single header and
  allow drawers to collapse without remounting screens.
- Inspection observes explicitly exposed component data and React render
  metrics. Web element picking uses public host DOM APIs; source locations and
  React component names require explicit instrumentation. Never infer unavailable
  source positions or read private React Fiber fields. Keep serialization/redaction limits and bounded history; avoid claims
  of arbitrary hook inspection, FPS measurement or complete privacy filtering.

## Tooling and validation

Use Yarn 4.18.1 with the `node-modules` linker and the committed `yarn.lock`.
CI uses Node 22. Use `yarn install --immutable` when installation is needed;
avoid introducing another package-manager lockfile.

Choose checks that cover the change:

| Change | Checks |
| --- | --- |
| Package dependency or export boundary | `yarn check:boundaries` |
| Package implementation or types | `yarn typecheck` and affected Jest tests |
| Example integration | `yarn typecheck:examples`, `yarn smoke:examples` and relevant live flow |
| Published files or exports | `yarn build:packages` then `yarn validate:packages` |
| Release qualification | `yarn validate:release` and the release checklist |

`yarn typecheck` builds packages first because examples resolve built exports.
Run `yarn build:packages` before checking examples when package outputs are stale.
For focused tests, use `yarn test:ci --runTestsByPath <test-file>`; `yarn test`
starts watch mode. Run `git diff --check` before handing off edits.

Use `yarn example:expo:web` for the Expo `/ide` workbench. Example smoke checks
inspect source integration; they do not prove a running browser or native app.
Report automated checks, live evidence and unresolved acceptance separately.
Update ticket status only when its acceptance criteria are actually met.

## Generated files and upstream showcase

- Edit source rather than `dist/`, `.expo/`, `expo-env.d.ts` or installed
  dependencies. Package build outputs are needed by consumer exports and can be
  regenerated with `yarn build:packages`.
- `examples/bluesky/` contains the maintained harness; the separate ignored
  checkout is `examples/upstream/bluesky`. Use
  `scripts/setup-bluesky-showcase.mjs` via `yarn showcase:clone` or
  `yarn showcase:prepare` to recreate/prepare the pinned reference.
- Preserve the upstream license and pinned commit checks. Inspect upstream Git
  status before changing or removing its checkout; ignored does not mean stale.
- Read `examples/bluesky/README.md`, `docs/tasks/RNBP-016.md` and
  `docs/evidence/IDE_UPLIFT.md` before upstream runtime work. Its dependencies
  use a separate toolchain and installation executes upstream hooks. Follow any
  active environment approval requirements and record runtime evidence before
  claiming real-app acceptance.

For release work, follow `docs/RELEASE_CHECKLIST.md` and verify the actual package
contents and installed consumer behavior. A successful build alone is not live
acceptance.
