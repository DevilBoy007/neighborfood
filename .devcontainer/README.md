# Neighborfood Development Container

This development container provides a complete environment for developing the Neighborfood Expo application.

## What's Included

- **Node.js 22**: Latest LTS version
- **npm**: Node package manager
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

## Ports

The following ports are automatically forwarded:
- **19000**: Expo DevTools
- **19001**: Expo Metro Bundler  
- **19002**: Expo Web (opens browser automatically)
- **8081**: Metro Bundler (alternative port)

## Post-Create Setup

The container automatically runs:
```bash
npm install && npx expo install
```

This ensures all dependencies are installed and Expo SDK versions are aligned.

## Usage with GitHub Copilot

This environment is optimized for use with GitHub Copilot coding agents and can be used to provision cloud-based development environments.
