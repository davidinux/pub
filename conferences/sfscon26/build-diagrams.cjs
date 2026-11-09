#!/usr/bin/env node

/**
 * Build script for generating Mermaid diagrams
 * Usage: npm run build:diagrams
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const diagrams = [
  {
    input: 'diagrams/tier-architecture.mmd',
    output: 'images/tier-architecture.png'
  },
  {
    input: 'diagrams/tier-architecture-tier1.mmd',
    output: 'images/tier-architecture-tier1.png'
  },
  {
    input: 'diagrams/tier-architecture-tier2.mmd',
    output: 'images/tier-architecture-tier2.png'
  },
  {
    input: 'diagrams/tier-architecture-tier3.mmd',
    output: 'images/tier-architecture-tier3.png'
  },
  {
    input: 'diagrams/privacy-capacity.mmd',
    output: 'images/privacy-capacity.png'
  },
  {
    input: 'diagrams/tier-overview.mmd',
    output: 'images/tier-overview.png'
  }
];

console.log('Generating Mermaid diagrams...');

let successCount = 0;
let errorCount = 0;

for (const diagram of diagrams) {
  try {
    const inputPath = path.resolve(diagram.input);
    const outputPath = path.resolve(diagram.output);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const bg = diagram.bg || 'transparent';
    execSync(
      `npx mmdc -i "${inputPath}" -o "${outputPath}" -b ${bg} -w 1200`,
      { stdio: 'inherit' }
    );

    console.log(`✓ Generated: ${diagram.output}`);
    successCount++;
  } catch (error) {
    console.error(`✗ Failed to generate ${diagram.output}:`, error.message);
    errorCount++;
  }
}

console.log(`\nGeneration complete:`);
console.log(`${successCount} successful, ${errorCount} failed`);

if (errorCount > 0) {
  process.exit(1);
}
