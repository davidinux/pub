# slidev-theme-openharmony

OpenHarmony corporate slide theme for [Slidev](https://sli.dev) — based on the official OpenHarmony PowerPoint template. Includes light and dark variants with gradient backgrounds, blue accent bars, and named slot layouts.

## Quick Start

### Clone and install

```bash
git clone https://github.com/davidinux/pub.git
cd pub/templates/slidev/openharmony
npm install
```

### Build the example

```bash
npx slidev build example.md
# output: dist/
```

Export to PDF:

```bash
npx slidev export example.md --output example-export.pdf
# output: example-export.pdf
```

Preview in browser:

```bash
npx slidev dev example.md
```

### Use in your own slides

Create `slides.md` pointing to the theme:

```yaml
---
theme: ./path/to/slidev-theme-openharmony
---
```

## Layouts

| Layout | Description |
|--------|-------------|
| `cover` | Title slide — blue gradient bg, white text, logo header |
| `default` | Content — white bg, blue accent bar, logo + tagline header |
| `default-dark` | Content — dark navy bg (#0D2B45), white text |
| `section` | Section divider — blue gradient with radial overlay |
| `end` | Thank you — blue gradient, centered "THANKS" text |
| `two-cols` | 2-column content — use `::title::`, `::left::`, `::right::` slots |
| `two-cols-dark` | 2-column content — dark bg variant |
| `three-cols` | 3-column content — use `::title::`, `::left::`, `::center::`, `::right::` slots |
| `three-cols-dark` | 3-column content — dark bg variant |
| `image` | Text left (44%) + image right (58%) with wavy clip mask; pass `image: '/url'` in frontmatter |

### Layouts with named slots

```yaml
---
layout: two-cols
---

::title::
# Section Title

::left::
### Column One

- Bullet item
- Another item

::right::
### Column Two

Content goes here
```

### Dark Mode

Toggle dark mode per-slide:

```yaml
---
layout: default-dark
---
```

## Fonts

**Noto Sans SC** — loaded from Google Fonts automatically. Supports both Simplified Chinese and Latin script.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Blue | `#00A1DF` | Primary, headings, accent |
| Dark Blue | `#0070B8` | Primary dark variant |
| Accent | `#4874CB` | Accent elements |
| Orange | `#EE822F` | Accent |
| Yellow | `#F2BA02` | Accent |
| Green | `#75BD42` | Accent |
| Dark Navy | `#0D2B45` | Dark backgrounds |
| White | `#FFFFFF` | Body text (dark bg) |

## File Structure

```
openharmony/
├── layouts/
│   ├── cover.vue           # Title (blue gradient)
│   ├── default.vue         # 1-col content light
│   ├── default-dark.vue    # 1-col content dark
│   ├── section.vue         # Section divider (blue gradient)
│   ├── end.vue             # Thank you (blue gradient)
│   ├── two-cols.vue        # 2-column light
│   ├── two-cols-dark.vue   # 2-column dark
│   ├── three-cols.vue      # 3-column light
│   ├── three-cols-dark.vue # 3-column dark
│   └── image.vue           # Text + image (wavy clip)
├── assets/
│   └── images/
│       ├── oh-logo.png         # OpenHarmony logo
│       └── oh-logo-thanks.png  # End slide logo (reserved)
├── styles/
│   └── index.css           # CSS vars, Google Fonts import, shared helpers
├── index.ts                # Style import entry point
├── package.json
└── README.md
```

## Theme Assets

Layouts import the logo directly from `assets/images/` using Vite's asset import system (e.g. `import logo from '../assets/images/oh-logo.png'` and `:src="logo"`). This ensures images are bundled by Vite and available during dev server, build, and export — no manual copying needed.

To reference images in your own presentation content, place them in your local `public/` directory and use root-relative paths like `/images/your-file.png` (Vite serves the user's `public/` at the root).

## License

MIT
