# Neighborfood Development Container

This development container provides a complete environment for developing the Neighborfood Expo application.

## What's Included

- **Node.js 22**: Latest LTS version
- **npm**: Node package manager
- **Python 3.12**: For pre-commit hooks
- **pre-commit**: Git hooks framework for code quality
- **Expo CLI**: Automatically installed via postCreateCommand
- **VS Code Extensions**:
  - TypeScript
  - Expo Tools
  - GitHub Copilot

## Getting Started

1. Open this repository in VS Code
2. When prompted, click "Reopen in Container" (or use Command Palette: "Dev Containers: Reopen in Container")
3. Wait for the container to build and dependencies to install
4. Run `npx expo start` to start the development server

## Pre-commit Hooks

The container automatically installs pre-commit hooks that run on every commit:

- **ESLint**: Linting for TypeScript/JavaScript
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- File hygiene (trailing whitespace, end-of-file fixes, etc.)

To manually run hooks on all files:

```bash
pre-commit run --all-files
```

## Ports

The following ports are automatically forwarded:

- **19000**: Expo DevTools
- **19001**: Expo Metro Bundler
- **19002**: Expo Web (opens browser automatically)
- **8081**: Metro Bundler (alternative port)

## Post-Create Setup

The container automatically runs:

```bash
npm install && npx expo install && pip install pre-commit && pre-commit install
```

This ensures all dependencies are installed, Expo SDK versions are aligned, and git hooks are configured.

## Usage with GitHub Copilot

This environment is optimized for use with GitHub Copilot coding agents and can be used to provision cloud-based development environments.
