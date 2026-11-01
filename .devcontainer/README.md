# Neighborfood Development Container

This development container provides a complete environment for developing the Neighborfood Expo
app and its Firebase Cloud Functions. The GitHub Copilot coding agent is provisioned with the same
tools by `.github/workflows/copilot-setup-steps.yml`; keep the two in sync.

## What's Included

| Tool                | Version       | Used for                                              |
| ------------------- | ------------- | ----------------------------------------------------- |
| Node.js             | 26 (`.nvmrc`) | Expo SDK 58 app tooling (functions deploy to Node 22) |
| Java (Temurin)      | 21            | Firebase Firestore/Storage emulators                  |
| Python + pre-commit | 3.12          | Git hooks (`.pre-commit-config.yaml`)                 |
| firebase-tools      | 15            | Emulators, deploys, secrets                           |
| eas-cli             | latest        | EAS Build/Submit/Update and workflows                 |
| GitHub CLI          | latest        | PRs, issues, security alerts                          |

Optional: install the [Stripe CLI](https://docs.stripe.com/stripe-cli) to forward test-mode
webhooks to the emulator (see `functions/README.md`).

## Getting Started

1. Open this repository in VS Code
2. Run "Dev Containers: Reopen in Container"
3. Copy `.env.example` to `.env` and fill in test values
4. `npx expo start` for the app, `npm run emulators` for local Firebase

## Common Commands

```bash
npm run lint && npm run format:check && npm run typecheck
npm test                 # app unit/component tests
npm run test:functions   # Cloud Functions tests against the emulators
pre-commit run --all-files
```

## Ports

| Port | Service            |
| ---- | ------------------ |
| 8081 | Metro bundler      |
| 9099 | Auth emulator      |
| 8080 | Firestore emulator |
| 5001 | Functions emulator |
| 9199 | Storage emulator   |

## Post-Create Setup

`.devcontainer/post-create.sh` installs app and functions dependencies with `npm ci`, installs
firebase-tools and eas-cli, and sets up the pre-commit hooks.
