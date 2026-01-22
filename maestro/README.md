# Neighborfood Maestro E2E Tests

This directory contains Maestro flows for end-to-end testing of the Neighborfood app.

## Structure

```
maestro/
├── flows/
│   ├── login.yaml          # Login flow tests
│   ├── registration.yaml   # User registration tests
│   ├── market.yaml         # Market browsing tests
│   ├── cart.yaml           # Cart functionality tests
│   └── checkout.yaml       # Checkout flow tests
├── config.yaml             # Maestro configuration
└── README.md               # This file
```

## Running Tests Locally

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all flows
maestro test maestro/

# Run specific flow
maestro test maestro/flows/login.yaml

# Run with recording
maestro test --record maestro/flows/login.yaml
```

## Running via EAS Workflows

```bash
# Trigger E2E tests for both platforms
eas workflow:run .eas/workflows/e2e-tests.yml -F platform=both

# Trigger for specific platform
eas workflow:run .eas/workflows/e2e-tests.yml -F platform=ios
```

## Writing New Tests

See [Maestro Documentation](https://maestro.mobile.dev/) for flow syntax.

Example flow:

```yaml
appId: com.neighborfood.app
---
- launchApp
- tapOn: 'Login'
- inputText:
    id: 'email'
    text: 'test@example.com'
- tapOn: 'Submit'
- assertVisible: 'Welcome'
```
