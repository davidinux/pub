#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname);
const requiredPaths = [
  'node_modules/.bin/slidev',
  'node_modules/playwright-chromium',
  'node_modules/@mermaid-js/mermaid-cli',
  'node_modules/slidev-theme-linaro'
];

const missing = requiredPaths.filter((relativePath) =>
  !fs.existsSync(path.join(root, relativePath))
);

if (missing.length > 0) {
  console.error('Presentation dependencies are missing or incomplete.');
  console.error('From this directory, run: /usr/bin/npm install');
  process.exit(1);
}
