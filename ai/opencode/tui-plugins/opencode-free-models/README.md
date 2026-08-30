# opencode-free-models

OpenCode TUI sidebar plugin that lists **free** and **paid** Zen models with live, task-aware recommendations. Companion to [`opencode-stats-for-nerds`](https://github.com/imluckii/opencode-stats-for-nerds) (not bundled).

## What it shows

```
┌──────────────────────────────────┐
│ ★ nemotron-3-ultra-free  best     │  green = best overall
│ task: code — ctx 1M kwn 2026-02   │  (free ✓ or $x.xx/$y.yy)
│ ◆ kimi-k2.5-free  best free      │  yellow = best free (when overall is paid)
└──────────────────────────────────┘

▼ Free Models  18
  1. nemotron-3-ultra-free ★ 87
     ctx 1M  kwn 2026-02
  ...
▼ Paid Models  67
  1. deepseek-v4-flash ★ 89
     ctx 1M  kwn 2025-05  $0.14/$0.28/1M in/out
```

- **Live free detection** — reads `api.state.provider` `cost` (zero-cost → free). If Zen makes `deepseek-v4-flash-free` paid, it moves to Paid automatically.
- **Task-aware** — classifies your last prompt (`long context` / `speed` / `reasoning` / `code` / `general`) + current `ctxUsed` (>150k → long context) via `api.state.session.messages` / `api.state.part`. Updates on every `message.updated` / `session.idle`.
- **Per-tier picks** — `pickBest(task, list)`:
  - `long context` → max `limit.context` in tier
  - `speed` → `*flash*` else top score
  - `reasoning` → `reasoning:true` then score
  - `code` → `*code*` else top score
- **Ranking** — 60% knowledge cutoff (log) + 40% context window (log2), `scoreModel()`.

## Install (private, `file://` workaround)

opencode 1.17.10–1.18.x has a known bug where npm-spec TUI plugins fail to render `sidebar_content` (#33884, #34050) — the plugin loads an isolated `@opentui/solid`. The reliable fix is a `file://` path outside `node_modules` (which runs through the Solid transform and is bridged to the host renderer).

```bash
mkdir -p ~/.config/opencode/plugins
cp tui.tsx ~/.config/opencode/plugins/free-models.tsx

# then in ~/.config/opencode/tui.json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "file:///home/<you>/.config/opencode/plugins/free-models.tsx",
    "file:///home/<you>/.config/opencode/plugins/stats-for-nerds.tsx"
  ]
}

# deps for local file plugins (host provides @opentui/solid)
# add to ~/.config/opencode/package.json:
# { "dependencies": { "@opencode-ai/plugin": "^1.14.33", "solid-js": "^1.9.12" } }
cd ~/.config/opencode && npm install --no-audit --no-fund
# restart opencode
```

For npm distribution instead, publish this package and use `"opencode-free-models"` in `tui.json: plugin` — the `exports["./tui"]` entry above is already set.

## Companion

- `opencode-stats-for-nerds` (public, by imluckii) — token/context/cost/speed panel. Not included here; install separately.

## License

MIT
