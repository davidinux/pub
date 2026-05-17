# HDC 2026 Flutter on OpenHarmony Presentation

This repository contains the presentation materials for the HDC 2026 conference session titled "Flutter on OpenHarmony: A New Embedder Direction".

## Repository Structure

- `abstract.md` - Conference abstract (short version)
- `presentation.md` - Full 10-slide presentation 
- `slides.md` - Symlink to abstract.md (for Slidev CLI compatibility)
- `abstract.pdf` - Exported PDF of abstract
- `package.json` - Build scripts and dependencies
- `layouts/`, `styles/`, `public/` - Slidev theme components
- `diagrams/` - Mermaid diagram source files
- `public/images/` - Generated PNG diagram images
- `build-diagrams.js` - Script to generate Mermaid diagrams

## Dependencies

This presentation requires the following dependencies:

### Core Dependencies
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Required Packages (installed via npm install)
- `@slidev/cli` - Presentation framework
- `@mermaid-js/mermaid-cli` - Mermaid diagram generation
- `puppeteer` - Browser automation for diagram rendering

These are specified in the `package.json` devDependencies section.

## Getting Started

1. **Clone and navigate to the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate Mermaid diagrams**:
   ```bash
   npm run build:diagrams
   ```

4. **View presentation**:
   ```bash
   # View abstract (default)
   npx slidev
   
   # View full presentation
   ln -sf presentation.md slides.md && npx slidev
   ```

## Building and Viewing Presentations

### Quick View (Recommended)
To view either presentation, simply run:
```bash
# View abstract (default)
npx slidev

# View full presentation
ln -sf presentation.md slides.md && npx slidev
```

The `slides.md` symlink is a workaround for Slidev CLI limitations. It points to `abstract.md` by default but can be switched to `presentation.md` when needed.

### Exporting to PDF
```bash
# Export abstract to PDF
npx slidev export abstract.md

# Export presentation to PDF  
npx slidev export presentation.md
```

Both exports will be saved as `abstract-export.pdf` and `presentation-export.pdf` respectively.

## Diagram Generation

Mermaid diagrams are automatically generated from `.mmd` files in the `diagrams/` directory. To regenerate all diagrams:

```bash
npm run build:diagrams
```

This will generate PNG files in the `public/images/` directory with transparent backgrounds.

## Reproduction Instructions for AI/Developer

To recreate this presentation from scratch, follow these steps:

1. Clone this repository
2. Install Node.js and npm
3. Install dependencies: `npm install`
4. Generate diagrams: `npm run build:diagrams`
5. View presentation: `npx slidev` (or `npx slidev export` to export PDF)

The presentation uses:
- Slidev framework with Linaro theme
- Mermaid diagrams for visualizations
- Automatic diagram generation workflow
- Standard Markdown presentation format

## Repository Contents

- **Abstract**: Brief overview of the Flutter OpenHarmony integration approach
- **Presentation**: Complete 10-slide presentation covering:
  - Problem statement: Architecture mismatch
  - Evaluation of three approaches
  - Chosen solution: Flutter Web engine + Native API bridge
  - Phase timeline and roadmap
  - Linaro's role as bridge between communities and device makers

All content is licensed under the terms specified in the repository.