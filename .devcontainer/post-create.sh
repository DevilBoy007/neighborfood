#!/usr/bin/env bash
# Provisions the dev container. Mirrors .github/workflows/copilot-setup-steps.yml.
set -euo pipefail

npm ci
npm ci --prefix functions

npm install --global firebase-tools@15 eas-cli

pip install --user pre-commit
pre-commit install
