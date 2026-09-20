# opencode-free-models

OpenCode TUI sidebar plugin that lists **free** and **paid** Zen models with live, task-aware recommendations. Companion to [`opencode-stats-for-nerds`](https://github.com/imluckii/opencode-stats-for-nerds) (not bundled).

## What it shows

```
┌──────────────────────────────────┐
│ ★ nemotron-3-ultra-free  best     │  green = best overall
│ task: code — ctx 1M kwn 2026-02   │  (free ✓ / Go $cap/mo / $x.xx)
│ ◆ kimi-k2.5-free  best free      │  yellow = best free (when overall isn't free)
│ ● mimo-v2.5  best Go             │  blue = best Go (when Go connected & different)
└──────────────────────────────────┘

▼ Free Models  7 (+ anon twins)
  1. nemotron-3-ultra-free ★ 87
     ctx 1M  kwn 2026-02
  ...
▼ Go Models  27 ($10/mo sub)
  1. mimo-v2.5 ● 84
     ctx 262k  kwn 2024-12  Go $60/mo
▼ Paid Models  60+
  1. deepseek-v4-flash ★ 89
     ctx 1M  kwn 2025-05  $0.14/$0.28/1M in/out
```

- **Live free detection** — reads `api.state.provider` `cost` (zero-cost → free). If Zen makes `deepseek-v4-flash-free` paid, it moves to Paid automatically.
- **Task-aware** — classifies your last prompt (`long context` / `speed` / `reasoning` / `code` / `general`) + current `ctxUsed` (>150k → long context) via `api.state.session.messages` / `api.state.part`. Updates on every `message.updated` / `session.idle`.
- **Per-tier picks** — `pickBest(task, list)` per tier (Free / Go / Paid):
  - `long context` → max `limit.context` in tier
  - `speed` → `*flash*` else top score
  - `reasoning` → `reasoning:true` then score
  - `code` → `*code*` else top score
- **Go tier** (`provider === "opencode-go"`, `$10/mo` sub) — own section with per-model monthly caps (`GO_LIMITS`: $60/$30/$15, post DeepSeek 4x promo ending Sep 20 2026). Before subscribing the section shows `/connect → OpenCode Go ($10/mo) to unlock`. Go models are excluded from Paid.
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

## Dual access: keyed + anonymous free tier

Zen free quotas are per-bucket: requests **with** your Zen API key count against your account; requests **without** a key count against the anonymous per-IP bucket. When one bucket hits `Rate limit exceeded`, the other may still work.

Add an anonymous mirror provider (no credential stored → no `Authorization` header; requests ride opencode's own stack with the official client fingerprint). Covers the `chat/completions` free models (MiMo, Ling, Nemotron, Big Pickle):

```json
// ~/.config/opencode/opencode.json (or opencode.jsonc)
{
  "provider": {
    "zen-free": {
      "name": "Zen Free (anonymous)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "https://opencode.ai/zen/v1" },
      "models": {
        "mimo-v2.5-free": { "name": "MiMo V2.5 Free (anon)" },
        "ling-3.0-flash-fin-free": { "name": "Ling 3.0 Flash Fin Free (anon)" },
        "nemotron-3-ultra-free": { "name": "Nemotron 3 Ultra Free (anon)" },
        "nemotron-3.5-lightning-free": { "name": "Nemotron 3.5 Lightning Free (anon)" },
        "big-pickle": { "name": "Big Pickle (anon)" }
      }
    }
  }
}
```

Then `zen-free/<model>` appears in `/models` and in this plugin's **Free Models** list (keyed twins sort first on score ties; `(anon)` twins inherit the score/ctx/knowledge display). When the keyed variant rate-limits, switch to its `(anon)` twin and vice versa.

Caveats:
- Anonymous quota is **per public IP** — machines behind the same NAT share it. Heavy use on one host drains the spare bucket for all of them.
- Only `chat/completions` models are covered (`responses`-based `muse-spark-*-free` and `systemone`-based `jev-*-free` need different `npm`/endpoint shapes).
- Verified with `opencode run --dir /tmp/zen-test -m zen-free/mimo-v2.5-free "Reply with exactly: anon-ok"` → `anon-ok`.

## Companion

- `opencode-stats-for-nerds` (public, by imluckii) — token/context/cost/speed panel. Not included here; install separately.

## License

MIT
