# HDC 2026 Flutter on OpenHarmony Presentation

This repository contains the presentation materials for the HDC 2026 conference session titled "Flutter on OpenHarmony: A New Embedder Direction".

## Repository Structure

- `abstract.md` - Conference abstract (short version)
- `presentation.md` - Full HDC 2026 presentation (Linaro theme, English)
- `presentation-openharmony-theme.md` - Same content, OpenHarmony theme (English)
- `presentation-zh.md` - Chinese translation (Linaro theme)
- `presentation-openharmony-theme-zh.md` - Chinese translation (OpenHarmony theme)
- `slides.md` - Symlink to abstract.md (for Slidev CLI compatibility)
- `abstract-zh.md` - Chinese translation of abstract
- `abstract.pdf` - Exported PDF of abstract
- `presentation-export.pdf` - Exported PDF (Linaro, English)
- `presentation-openharmony-theme-export.pdf` - Exported PDF (OpenHarmony, English)
- `presentation-zh-export.pdf` - Exported PDF (Linaro, Chinese)
- `presentation-openharmony-theme-zh-export.pdf` - Exported PDF (OpenHarmony, Chinese)
- `package.json` - Build scripts and dependencies
- `diagrams/` - Mermaid diagram source files
- `images/` - Generated PNG diagram images
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
    
    # View presentation (pick one)
    ln -sf presentation.md slides.md && npx slidev        # Linaro, English
    # ln -sf presentation-zh.md slides.md && npx slidev   # Linaro, Chinese
   ```

## Building and Viewing Presentations

### Quick View (Recommended)
To view a presentation, run:
```bash
# View abstract (default)
npx slidev

# View full presentation (Linaro, English)
ln -sf presentation.md slides.md && npx slidev

# View full presentation (OpenHarmony, English)
ln -sf presentation-openharmony-theme.md slides.md && npx slidev

# View Chinese (Linaro theme)
ln -sf presentation-zh.md slides.md && npx slidev

# View Chinese (OpenHarmony theme)
ln -sf presentation-openharmony-theme-zh.md slides.md && npx slidev
```

The `slides.md` symlink is a workaround for Slidev CLI limitations. It points to `abstract.md` by default but can be switched to any presentation variant.

### Exporting to PDF
```bash
# Export abstract to PDF
npx slidev export abstract.md       # English
npx slidev export abstract-zh.md    # Chinese

# Export presentation (Linaro, English)
npm run export

# Export presentation (OpenHarmony, English)
npm run export:oh

# Export presentation (Linaro, Chinese)
npm run export:zh

# Export presentation (OpenHarmony, Chinese)
npm run export:oh-zh

# Export all 4 variants sequentially
npm run build:all
```

## Diagram Generation

Mermaid diagrams are automatically generated from `.mmd` files in the `diagrams/` directory. To regenerate all diagrams:

```bash
npm run build:diagrams
```

This will generate PNG files in the `images/` directory with transparent backgrounds.

## Reproduction Instructions for AI/Developer

To recreate this presentation from scratch, follow these steps:

1. Clone this repository
2. Install Node.js and npm
3. Install dependencies: `npm install`
4. Generate diagrams: `npm run build:diagrams`
5. View presentation: `npx slidev` (or `npm run export` / `npm run export:oh` to export PDF)

The presentation uses:
- Slidev framework (four theme+language variants: Linaro/OpenHarmony × English/Chinese)
- Mermaid diagrams for visualizations
- Automatic diagram generation workflow
- Standard Markdown presentation format

## Repository Contents

- **Abstract**: Brief overview of the Flutter OpenHarmony integration approach (English + Chinese)
- **Presentation**: Complete presentation (2 themes × 2 languages = 4 variants) covering:
  - Problem statement: Architecture mismatch and cross-layer coupling
  - Embedder architecture fundamentals
  - Evaluation of three approaches
  - Chosen solution: Flutter Web Engine + OHOS Embedder
  - Phase timeline and roadmap
  - Linaro's role as bridge between communities and device makers

All content is licensed under the terms specified in the repository.