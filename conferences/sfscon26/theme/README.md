# slidev-theme-linaro

Linaro corporate slide theme for [Slidev](https://sli.dev) — based on the Linaro 2025 brand PowerPoint template. Light and dark variants with PNG background assets, header bars, decorative symbols, and named slot layouts.

## Quick Start

### Clone and install

```bash
git clone https://github.com/davidinux/pub.git
cd pub/templates/slidev/linaro
npm install
```

### Build the example

**Important:** When building from `example/` subdirectory, use `theme: ../` in frontmatter (not `theme: ./`) so Slidev resolves the theme root correctly.

```bash
npx slidev build example/example.md
# output: example/dist/
```

The example's `example.md` already uses `theme: ../` so it works out of the box.

Export to PDF:

```bash
npx slidev export example/example.md
# output: example/example-export.pdf
```

Preview in browser:

```bash
npx slidev dev example/example.md
```

### Use in your own slides

Create `slides.md` next to the theme directory (or anywhere), pointing to it:

```yaml
---
theme: ../pub/templates/slidev/linaro
---
```

Or use an absolute path:

```yaml
---
theme: /path/to/pub/templates/slidev/linaro
---
```

## Layouts

This theme provides 12 layouts. Specify via frontmatter:

| Layout | Description |
|--------|-------------|
| `cover` | Title slide — white bg, purple blob corners, purple logo |
| `cover-dark` | Title slide — deep purple bg, white blob corners, white logo |
| `default` | Content — white bg, dark logo header, faint Linaro symbol |
| `default-dark` | Content — dark bg (#1a1a1a), yellow text, white logo header |
| `section` | Section divider — yellow bg with wavy Linaro banner |
| `end` | Thank you — purple bg with ribbon wave, right-aligned text |
| `two-cols` | 2-column content — white bg, use `::left::` / `::right::` slots |
| `two-cols-dark` | 2-column content — dark bg, yellow accents |
| `three-cols` | 3-column content — white bg, use `::left::` / `::center::` / `::right::` slots |
| `three-cols-dark` | 3-column content — dark bg, yellow accents |
| `image` | Text left (44%) + image right (58%) with wavy clip mask; pass `image: '/url'` in frontmatter |

### Layouts with named slots

For multi-column layouts, use Slidev's named slot syntax with `::marker::` directives:

```yaml
---
layout: two-cols
---

# Section Title

:left:
### Column One

- Bullet item
- Another item

:right:
### Column Two

Content goes here

---
```

Or with a title slot:

```yaml
---
layout: two-cols
---

:title:
# My Title

:left:
Left content

:right:
Right content
```

### Slide title in named slot

On `two-cols` and `three-cols`, the `::title::` slot renders the h1 with purple heading styling above the columns.

## Dark Mode

Toggle dark mode per-slide:

```yaml
---
class: dark
layout: default-dark
---
```

Or press `D` during presentation. Alternatively, use the `dark` class to force any layout into dark mode:

```yaml
---
class: dark
layout: two-cols
---
```

## Fonts

**Reddit Sans** — loaded from Google Fonts automatically. No installation needed.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Purple | `#6715E8` | Primary, headings (light layouts), h1 |
| Yellow | `#FFCF00` | Primary, headings (dark layouts) |
| Pink | `#FF0099` | Accent |
| Cyan | `#00B2FF` | Accent |
| Black | `#1A1A1A` | Body text (light bg) |
| White | `#FFFFFF` | Body text (dark bg) |

## File Structure

```
linaro/
├── layouts/
│   ├── cover.vue           # Title light
│   ├── cover-dark.vue      # Title dark
│   ├── default.vue         # 1-col content light
│   ├── default-dark.vue    # 1-col content dark
│   ├── section.vue         # Section divider (yellow)
│   ├── end.vue             # Thank you (purple)
│   ├── two-cols.vue        # 2-column light
│   ├── two-cols-dark.vue   # 2-column dark
│   ├── three-cols.vue      # 3-column light
│   ├── three-cols-dark.vue # 3-column dark
│   └── image.vue           # Text + image (wavy clip)
├── assets/
│   └── images/
│       ├── bg-title-light.png     # Cover light background
│       ├── bg-title-dark.png      # Cover dark background
│       ├── bg-section.png         # Section divider wave
│       ├── bg-thankyou.png        # Thank you wave
│       ├── linaro-logo-dark.png
│       ├── linaro-logo-purple.png
│       ├── linaro-logo-white.png
│       ├── linaro-logo-white2.png
│       └── linaro-symbol-dark.png
├── styles/
│   └── index.css           # CSS vars, Google Fonts import, shared helpers
├── public/
│   └── linaro-logo.svg     # Legacy — not used by layouts
├── index.ts                # Style import entry point
├── package.json
└── README.md
```

## How It Works

Each layout `.vue` file has all styling in a `<style scoped>` block. This guarantees CSS is bundled by Vite regardless of how the theme is referenced. Backgrounds use absolute-positioned `<img>` elements importing images from `assets/images/` via Vite's asset import system.

The global `styles/index.css` sets CSS custom properties (brand colors, font family) and shared utility classes (`.linaro-header`, `.linaro-page-num`).

## Building from a Subdirectory

When building from a subdirectory (e.g. `example/`), use `theme: ../` in frontmatter instead of `theme: ./`. This makes Slidev resolve the theme root correctly, ensuring both layout CSS and images are bundled properly.

```yaml
---
theme: ../
---
```

The included `example/example.md` already uses this pattern.

## Theme Assets

Layouts import images directly from `assets/images/` using Vite's asset import system (e.g. `import bgBlobs from '../assets/images/bg-title-light.png'` and `:src="bgBlobs"`). This ensures images are bundled by Vite and available during dev server, build, and export — no manual copying needed.

To reference images in your own presentation content, place them in your local `public/` directory and use root-relative paths like `/images/your-file.png` (Vite serves the user's `public/` at the root).

## License

MIT