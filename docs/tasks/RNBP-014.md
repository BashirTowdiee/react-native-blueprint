# RNBP-014: Development-only entry and production safeguards

**Phase:** Packaging

**Priority:** P1

**Status:** DONE

**Depends on:** RNBP-001, RNBP-006

## Objective

Make Blueprint safe to install in an application without unintentionally shipping its development UI or tooling.

## Scope

- Define recommended dev-only mounting pattern for Expo Router.
- Define recommended dev-only mounting pattern for bare React Native.
- Add production guard behaviour.
- Document bundler/tree-shaking limitations and expectations.
- Ensure adapters do not start servers or mutate files as import side effects.

## Acceptance criteria

- Example production configuration does not expose the Blueprint route/screen.
- Importing core packages has no file-system/network side effects.
- Development entry is explicit and documented for both supported navigation stacks.
- Tests verify production guards where practical.
- README clearly distinguishes development integration from application runtime code.
