# opencode-free-models

OpenCode TUI sidebar plugin that lists **free**, **Go** ($10/mo subscription), and **paid** Zen models with live, task-aware, **cost-aware** recommendations. Companion to [`opencode-stats-for-nerds`](https://github.com/imluckii/opencode-stats-for-nerds) (not bundled).

## What it shows

```
┌──────────────────────────────────────────────┐
│ ★ deepseek-v4-flash  best                     │  green = best overall (cap+cost)
│ task: code — ctx 1M  kwn 2025-05              │
│ $0.14/$0.28/1M  (cap 92  eff 83)             │
│ ◆ nemotron-3-ultra-free  best free            │  yellow = best free (when different)
│ ◇ deepseek-v4-flash  cheapest capable         │  gray = cheapest model ≥70% capability
│ ● mimo-v2.5  best Go                          │  blue = best Go (when Go connected)
└──────────────────────────────────────────────┘

▼ Free Models  7+5(anon)      [ranked by capability only]
  1. nemotron-3-ultra-free ★ 92
     ctx 1M  kwn 2026-02  free ✓  (cap 92  eff 100)
  ...
▼ Go Models  28               [ranked by cap 40% + cost 60%]
  1. mimo-v2.5 ● 84
     ctx 262k  kwn 2024-12  Go $60/mo  (cap 42  eff 83)
▼ Paid Models  90+            [ranked by cap 40% + cost 60%]
  1. deepseek-v4-flash ★ 87
     ctx 1M  kwn 2025-05  $0.14/$0.28/1M  (cap 92  eff 83)
```

- **Live free detection** — reads `api.state.provider` `cost` (zero-cost → free). If Zen makes a free model paid, it moves to Paid automatically.
- **Task-aware** — classifies your last prompt (`long context` / `speed` / `reasoning` / `code` / `general`) + current `ctxUsed` (>150k → long context) via `api.state.session.messages` / `api.state.part`. Updates on every `message.updated` / `session.idle`.
- **Cost-aware ranking** — `combinedScore = capabilityScore × 0.4 + costScore × 0.6`. Free models ranked by capability only (all cost 0). Go and Paid ranked by combined score. This prevents expensive models (GPT 6 Luna at $0.20/$0.75) from being recommended over cheaper alternatives (DeepSeek V4 Flash at $0.14/$0.28, 4x more context) when both can do the job.
- **Cost scoring** — `costScore = 1/(1 + avgCostPer1M)`. Free = 1.0, Go (subscription) = 0.83, Paid $0.14 = 0.83, Paid $5.00 = 0.17, Paid $10.00 = 0.03.
- **Per-tier picks** — `pickBest(task, list)`:
  - `long context` → highest ctx (within 20% of max), then cheapest
  - `speed` → `*flash*` (cheapest by combined score)
  - `reasoning` → `reasoning:true` (cheapest by combined score)
  - `code` → `*code*` (cheapest by combined score)
- **Cheapest capable** — among models with capability ≥ 70% of bestOverall, picks the lowest-cost one. Shown as a separate gray badge only when it differs from best overall.
- **Go tier** (`provider === "opencode-go"`, `$10/mo` sub) — own section with per-model monthly caps (`GO_LIMITS`: $60/$30/$15, post DeepSeek 4x promo). Before subscribing, shows `/connect → OpenCode Go ($10/mo) to unlock`.
- **Dual free-tier access** — `zen-free/*` anon twins (score/ctx inherited from `opencode/*` twin, keyed sorts first on ties). When keyed free is rate-limited, switch to the anon twin.

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
