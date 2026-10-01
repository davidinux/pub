#!/usr/bin/env node

/**
 * Build script for generating Mermaid diagrams
 * Usage: npm run build:diagrams
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define diagram configurations
const diagrams = [
  {
    input: 'diagrams/roadmap-overview.mmd',
    output: 'images/roadmap-overview.png'
  },
  {
    input: 'diagrams/milestones-timeline.mmd',
    output: 'images/milestones-timeline.png'
  },
  {
    input: 'diagrams/architecture.mmd',
    output: 'images/architecture.png'
  },
  {
    input: 'diagrams/problem-strategy.mmd',
    output: 'images/problem-strategy.png'
  }
];

console.log('Generating Mermaid diagrams...');

let successCount = 0;
let errorCount = 0;

// Process each diagram
for (const diagram of diagrams) {
  try {
    const inputPath = path.resolve(diagram.input);
    const outputPath = path.resolve(diagram.output);

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Generate PNG using mmdc
    execSync(
      `npx mmdc -i "${inputPath}" -o "${outputPath}" -b transparent -w 1400 -p puppeteer-config.json`,
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