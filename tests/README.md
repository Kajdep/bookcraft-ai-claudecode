# Test Files and Development Scripts

This directory contains test files, debug scripts, and development utilities that were used during the development of BookCraft AI.

## Contents

- **AI Tests**: `ai-*.cjs` - Tests for AI integration and features
- **Debug Scripts**: `debug-*.js` - Debugging utilities for various components
- **Manual Tests**: `manual-*.cjs` - Manual testing scripts for features
- **Component Tests**: Various `.js` files testing specific components

## Note

These files are for development and debugging purposes only. They are not part of the production application and should not be deployed.

## Usage

To run any test file:
```bash
node tests/filename.cjs
```

Or with Playwright for browser tests:
```bash
npx playwright test tests/filename.cjs
```
