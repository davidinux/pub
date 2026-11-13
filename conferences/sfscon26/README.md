# SFSCON 2026 — Sovereign AI in Production

This repository contains the presentation materials for the SFSCON 2026 session titled "Sovereign AI in Production: Blueprint for a Globally Distributed Dev Team".

## Repository Structure

- `presentation.md` - Full presentation (English, Linaro theme)
- `presentation-it.md` - Italian translation (Linaro theme)
- `package.json` - Build scripts and dependencies
- `diagrams/` - Mermaid diagram source files
- `images/` - Generated PNG diagram images
- `build-diagrams.cjs` - Script to generate Mermaid diagrams
- `theme/` - Bundled Linaro Slidev theme (self-contained)
- `LICENSE` - Copyright and CC BY 4.0 licensing terms

## Dependencies

This presentation requires the following dependencies:

### Core Dependencies
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Required Packages (installed via npm install)
- `@slidev/cli` - Presentation framework
- `@mermaid-js/mermaid-cli` - Mermaid diagram generation
- `puppeteer` - Browser automation for diagram rendering
- `playwright-chromium` - Browser automation for PDF export

These are specified in the `package.json` devDependencies section.

### Linaro Slidev Theme
The Linaro Slidev theme is bundled locally in the `theme/` directory and referenced via `theme: ./theme` in the presentation frontmatter. It is also declared as a local dependency (`file:./theme`) in `package.json`. No external repository access is required.

## Getting Started

1. **Navigate to the repository**
2. **Install dependencies**:
   ```bash
   /usr/bin/npm install
   ```
   (Use `/usr/bin/npm` — the default `npm` may be an older v6 that resolves incompatible versions.)

The build and export commands check for installed dependencies before starting and stop with a clear message if `npm install` has not been run.

> **Note:** Use `/usr/bin/npm` (v10+) instead of the default `npm` (v6) which may resolve incompatible dependency versions. If `npm --version` shows 6.x, use `/usr/bin/npm` instead.

3. **Generate Mermaid diagrams**:
   ```bash
   npm run build:diagrams
   ```

4. **View presentation**:
   ```bash
   # View English presentation
   ln -sf presentation.md slides.md && npx slidev

   # View Italian presentation
   ln -sf presentation-it.md slides.md && npx slidev
   ```

## Building and Viewing Presentations

`npm run build` builds the English presentation for production. It first regenerates the Mermaid diagrams used by both decks.

### Quick View (Recommended)
To view a presentation, run:
```bash
# View English presentation
ln -sf presentation.md slides.md && npx slidev

# View Italian presentation
ln -sf presentation-it.md slides.md && npx slidev
```

The `slides.md` symlink is a workaround for Slidev CLI limitations. It points to `presentation.md` by default but can be switched to any variant.

### Exporting to PDF
```bash
# Export English presentation to PDF
npm run export

# Export Italian presentation to PDF
npm run export:it

# Export both PDFs sequentially
npm run build:all
```

`npm run export`, `npm run export:it`, and `npm run build:all` regenerate the Mermaid diagrams before exporting, so a fresh checkout does not depend on previously generated tier diagram PNGs.

## Diagram Generation

Mermaid diagrams are automatically generated from `.mmd` files in the `diagrams/` directory. To regenerate all diagrams:

```bash
npm run build:diagrams
```

This will generate PNG files in the `images/` directory with transparent backgrounds.

## Cleaning

To remove all generated artifacts and dependencies:

```bash
npm run clean
```

This removes `node_modules/`, `dist/`, exported PDFs, and `package-lock.json`.

## Reproduction Instructions for AI/Developer

To recreate this presentation from scratch, follow these steps:

1. Clone this repository
2. Install Node.js and npm
3. Install dependencies: `/usr/bin/npm install`
4. Generate diagrams: `npm run build:diagrams`
5. View presentation: `npx slidev` (or `npm run export` / `npm run export:it` to export PDF)

The presentation uses:
- Slidev framework (2 variants: English and Italian)
- Mermaid diagrams for visualizations
- Automatic diagram generation workflow
- Standard Markdown presentation format

## Repository Contents

- **Presentation**: Complete presentation (English + Italian) covering:
  - The question: can we build AI infrastructure independent of big providers?
  - Terminology: closed vs open-weight vs truly open source models
  - The gap is closing: Artificial Analysis data
  - Five alternatives: decreasing privacy and control
  - Capacity vs control tradeoff
  - Linaro's two worlds: open source + confidential
  - Three-tier architecture: open code, confidential high-perf, confidential simple tasks
  - Why hybrid beats centralized: 4 advantages
  - Data sovereignty: three levels (residency, jurisdiction, contractual/technical)
  - Balancing cost, performance, quality: 3 levers

Unless otherwise noted, presentation content is Copyright (c) 2026 Linaro Ltd.
and licensed under CC BY 4.0. See `LICENSE`. Linaro trademarks and logos remain
protected, and third-party material retains its original license terms.
