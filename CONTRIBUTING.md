# Contributing to FormDrive

Thank you for improving FormDrive. Keep changes focused, testable and compatible with the model-specific part architecture.

## Development setup

1. Use Node.js 22 or newer.
2. Install dependencies with `npm install`.
3. Start Vite with `npm run dev -- --port 12314`.
4. Make the smallest change that solves the issue.

## Pull requests

- Explain the user-visible result and the technical approach.
- Keep UI copy in English.
- Do not replace or relicense third-party vehicle assets without explicit provenance.
- Do not rename, merge or flatten moving-part nodes without updating the corresponding vehicle configuration.
- Avoid unrelated formatting or dependency changes.
- Include before/after captures for visible UI or rendering changes.

## Required verification

Run a production build:

```bash
npm run build
```

Changes touching the scene, UI controls or models must pass all vehicle suites:

```bash
node scripts/verify-studio.mjs mustang 1536 900 --summary
node scripts/verify-studio.mjs tesla 1536 900 --summary
node scripts/verify-studio.mjs concept 1536 900 --summary
node scripts/verify-single-vehicle.mjs
```

Chrome must be available with the DevTools protocol on port `12319`; see the main README for the launch command.

## Commit style

Use an imperative, scoped subject when possible:

```text
fix: align Mustang compound window motion
perf: defer non-active vehicle downloads
docs: clarify third-party model licensing
```

## Licensing

By contributing source code, you agree that your contribution may be distributed under the MIT License. Vehicle assets remain governed by their individual attribution files.
