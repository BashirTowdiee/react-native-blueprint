# RNBP-016 — Inspection workbench and production-scale showcase

Status: BLOCKED (local IDE complete; real-app runtime verification requires dependency-install approval)

## Outcome

Developers can find screens and components, touch a meaningful component region,
read its live exposed data, copy a report, observe React render activity and reset
a preview. The default example is a larger interactive social fixture app, with
a separate real production Bluesky checkout and development harness.

## Delivered

- Workshop and capability limits: `docs/IDE_WORKSHOP.md`.
- Component inspection, search, copy, snapshots, change history, viewport tools and refresh: `docs/INSPECTION.md`.
- Rich fixture app: `examples/expo-router/showcase/SocialApp.tsx`.
- Pinned real-app clone/preparation: `scripts/setup-bluesky-showcase.mjs`.
- Upstream harness and launch instructions: `examples/bluesky/`.
- Automated and live evidence: `docs/evidence/IDE_UPLIFT.md`.

## Acceptance gap

Bluesky's dependency installation was rejected by automatic approval review.
The user was asked to approve that installation and real-app verification.
The checkout/harness are prepared but do not yet have build/runtime acceptance.
