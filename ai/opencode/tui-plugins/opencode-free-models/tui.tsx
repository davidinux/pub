/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createSignal, Show, onCleanup, createMemo } from "solid-js"

const PLUGIN_ID = "opencode-free-models"

function fmtCtx(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k"
  return String(n)
}

function fmtCost(cost: any): string {
  if (!cost || typeof cost !== "object") return ""
  const inp = typeof cost.input === "number" ? cost.input : null
  const out = typeof cost.output === "number" ? cost.output : null
  if (inp === null && out === null) return ""
  if (inp === 0 && out === 0) return "free"
  const f = (n: number) => (n < 0.01 ? n.toFixed(3) : n.toFixed(2))
  if (inp !== null && out !== null) return `$${f(inp)}/$${f(out)}/1M`
  if (inp !== null) return `$${f(inp)}/1M in`
  return `$${f(out!)}/1M out`
}

function isFree(model: any): boolean {
  const cost = model?.cost
  if (cost && typeof cost === "object") {
    const vals = [cost.input, cost.output, cost.cache_read, cost.cache_write].filter((v) => v !== undefined)
    if (vals.length > 0 && vals.every((v) => v === 0)) return true
  }
  return false
}

function scoreModel(model: any, provider: string): { score: number; costScore: number; combinedScore: number; knowledge: string; ctx: number } {
  const ctx = (model?.limit?.context as number) || 0
  let knowledgeMonths = 0
  const k = String(model?.knowledge || "")
  const m = k.match(/(\d{4})-(\d{2})/)
  if (m) {
    const y = parseInt(m[1], 10)
    const mo = parseInt(m[2], 10)
    knowledgeMonths = (y - 2020) * 12 + mo
  }
  const knowledgeScore = knowledgeMonths > 0 ? Math.min(knowledgeMonths / 80, 1) : 0
  const ctxScore = Math.min(Math.log2(Math.max(ctx, 1)) / 21, 1)
  const capabilityScore = knowledgeScore * 0.6 + ctxScore * 0.4

  let costPer1M = 0
  if (provider === "opencode-go") {
    costPer1M = 0.2
  } else {
    const cost = model?.cost
    if (cost && typeof cost === "object") {
      const inp = typeof cost.input === "number" ? cost.input : 0
      const out = typeof cost.output === "number" ? cost.output : 0
      costPer1M = (inp + out) / 2
    }
  }
  const costScore = 1 / (1 + costPer1M)
  const combinedScore = capabilityScore * 0.4 + costScore * 0.6

  return {
    score: capabilityScore,
    costScore,
    combinedScore,
    knowledge: knowledgeMonths > 0 ? k : "n/a",
    ctx,
  }
}

type ModelEntry = { id: string; name: string; score: number; costScore: number; combinedScore: number; knowledge: string; ctx: number; reasoning: boolean; family: string; cost: any; provider: string; ctxTier: number }

const GO_LIMITS: Record<string, number> = {
  "glm-5.3-flash": 60, "glm-5.2": 60, "glm-5.1": 60, "glm-5.3": 15,
  "kimi-k3": 15, "kimi-k2.7-code": 60, "kimi-k2.6": 60,
  "longcat-2.0": 60, "mimo-v2.5": 60, "mimo-v2.5-pro": 15,
  "minimax-m3": 60, "minimax-m2.7": 60, "minimax-m2.5": 60,
  "muse-spark-1.3-contributor": 60, "muse-spark-1.2-contributor": 60,
  "qwen3.8-max": 15, "qwen3.8-flash": 30, "qwen3.7-max": 30,
  "qwen3.7-plus": 60, "qwen3.6-plus": 60,
  "deepseek-v4.1-flash": 15, "deepseek-v4-pro": 15, "deepseek-v4-flash": 30,
  "deepseek-v4-flash-vision-exp": 15,
  "hy4-preview": 30, hy3: 60,
  "grok-4.6": 15, "gpt-5.6-luna": 15,
  "claude-haiku-5-5": 30, "gemini-4-argon-contributor": 30, "gpt-6-luna": 15,
  "mimo-v2.6-flash": 30, "mimo-v2.6-pro": 60, "minimax-m3.1-flash": 60,
  "omen-alpha": 60, "step-5-preview": 60,
}

function goBaseId(id: string): string {
  return (id.includes("/") ? id.split("/").slice(1).join("/") : id).toLowerCase()
}

function goLimit(m: ModelEntry): number | null {
  return GO_LIMITS[goBaseId(m.id)] ?? null
}

function fmtGoLimit(m: ModelEntry): string {
  const cap = goLimit(m)
  return cap === null ? "Go" : `Go $${cap}/mo`
}

function tierOf(m: ModelEntry): "free" | "go" | "paid" {
  if ((m as any).provider === "opencode-go") return "go"
  if ((m as any).provider === "zen-free") return "free"
  return isFree(m) ? "free" : "paid"
}

function getTask(text: string, ctxUsed: number): string {
  const t = text.toLowerCase()
  if (ctxUsed > 150_000 || /large|monorepo|many files|1m|context|entire repo|codebase/i.test(t)) return "long context"
  if (/fast|quick|small fix|typo|one.?line|trivial/i.test(t)) return "speed"
  if (/reason|math|logic|prove|algorithm|puzzle|think step/i.test(t)) return "reasoning"
  if (/code|implement|function|class|bug|feature|refactor|test/i.test(t)) return "code"
  return "general"
}

function pickBest(task: string, list: ModelEntry[]): ModelEntry | null {
  if (!list.length) return null
  const byTierThenCombined = (a: ModelEntry, b: ModelEntry) => a.ctxTier - b.ctxTier || b.combinedScore - a.combinedScore
  if (task === "long context") {
    const maxCtx = Math.max(...list.map((m) => m.ctx))
    const candidates = list.filter((m) => m.ctx >= maxCtx * 0.8)
    return (candidates.length ? candidates : list).sort(byTierThenCombined)[0]
  }
  if (task === "speed") {
    const flash = list.filter((m) => /flash/i.test(m.id))
    return (flash.length ? flash : list).sort(byTierThenCombined)[0]
  }
  if (task === "reasoning") {
    const cand = list.filter((m) => m.reasoning)
    return (cand.length ? cand : list).sort(byTierThenCombined)[0]
  }
  if (task === "code") {
    const cand = list.filter((m) => /code/i.test(m.id))
    return (cand.length ? cand : list).sort(byTierThenCombined)[0]
  }
  return [...list].sort(byTierThenCombined)[0]
}

// Cheapest capable: among models with capability >= 70% of the best in the full list,
// pick the one with the lowest per-1M cost (highest costScore). Returns null if
// it's the same as bestOverall (no need to show a separate badge).
function cheapestCapable(list: ModelEntry[], bestId: string | null): ModelEntry | null {
  if (!list.length || !bestId) return null
  const best = list.find((m) => m.id === bestId)
  if (!best) return null
  const threshold = best.score * 0.7
  const capable = list.filter((m) => m.score >= threshold)
  if (capable.length < 2) return null
  const cheapest = [...capable].sort((a, b) => b.costScore - a.costScore)[0]
  if (!cheapest || cheapest.id === bestId) return null
  return cheapest
}

function FreeModelsView(props: { api: Parameters<TuiPlugin>[0]; sessionID: string }) {
  const theme = () => props.api.theme.current
  const [collapsedFree, setCollapsedFree] = createSignal(false)
  const [collapsedGo, setCollapsedGo] = createSignal(false)
  const [collapsedPaid, setCollapsedPaid] = createSignal(false)
  const [tick, setTick] = createSignal(0)

  const stop1 = props.api.event.on("session.idle", () => setTick((v) => v + 1))
  const stop2 = props.api.event.on("message.updated", (e: any) => {
    if (e.properties?.sessionID !== props.sessionID) return
    setTick((v) => v + 1)
  })
  const stop3 = props.api.event.on("message.part.updated", (e: any) => {
    if (e.properties?.sessionID !== props.sessionID) return
    setTick((v) => v + 1)
  })
  onCleanup(() => { stop1(); stop2(); stop3() })

  const allModels = createMemo<ModelEntry[]>(() => {
    tick()
    const list: ModelEntry[] = []
    for (const p of props.api.state.provider) {
      const models = (p as any).models
      if (!models || typeof models !== "object") continue
      for (const [id, model] of Object.entries(models)) {
        const m: any = model
        const s = scoreModel(m, (p as any).id)
        list.push({
          id: id.includes("/") ? id : `${(p as any).id}/${id}`,
          name: typeof m?.name === "string" ? m.name : id,
          reasoning: Boolean(m?.reasoning),
          family: String(m?.family || ""),
          cost: m?.cost,
          provider: (p as any).id,
          score: s.score,
          costScore: s.costScore,
          combinedScore: s.combinedScore,
          knowledge: s.knowledge,
          ctx: s.ctx,
          ctxTier: s.ctx >= 1_000_000 ? 0 : 1,
        })
      }
    }
    return list
  })

  const isFreeEntry = (m: ModelEntry) =>
    ((m as any).provider === "opencode" && isFree(m)) || (m as any).provider === "zen-free"

  const enrichAnonTwins = (list: ModelEntry[]): ModelEntry[] => {
    const byId = new Map(list.map((m) => [m.id, m]))
    return list.map((m) => {
      if ((m as any).provider !== "zen-free") return m
      const base = m.id.includes("/") ? m.id.split("/").slice(1).join("/") : m.id
      const twin = byId.get(`opencode/${base}`) || byId.get(base)
      if (!twin) return m
      return { ...m, score: twin.score, costScore: twin.costScore, combinedScore: twin.combinedScore, knowledge: twin.knowledge, ctx: twin.ctx, ctxTier: twin.ctxTier, reasoning: twin.reasoning, family: twin.family }
    })
  }

  // Free models ranked by capability (score) only — all free, so cost doesn't differentiate
  const freeModels = createMemo(() =>
    enrichAnonTwins(allModels())
      .filter(isFreeEntry)
      .sort((a, b) => b.score - a.score || (((a as any).provider === "opencode" ? 0 : 1) - ((b as any).provider === "opencode" ? 0 : 1))),
  )
  const goModels = createMemo(() =>
    allModels()
      .filter((m) => (m as any).provider === "opencode-go")
      .sort((a, b) => a.ctxTier - b.ctxTier || b.combinedScore - a.combinedScore),
  )
  const paidModels = createMemo(() =>
    allModels()
      .filter((m) => !isFreeEntry(m as ModelEntry) && (m as any).provider !== "opencode-go")
      .sort((a, b) => a.ctxTier - b.ctxTier || b.combinedScore - a.combinedScore),
  )

  const task = createMemo(() => {
    tick()
    let lastText = ""
    let ctxUsed = 0
    try {
      const msgs = props.api.state.session.messages(props.sessionID) as any[]
      const lastUser = [...msgs].reverse().find((m: any) => m.role === "user")
      if (lastUser?.id) {
        try {
          const parts = props.api.state.part(lastUser.id) as any[]
          lastText = parts
            .filter((p: any) => p.type === "text" && typeof p.text === "string")
            .map((p: any) => p.text)
            .join(" ")
        } catch {}
        if (!lastText && typeof (lastUser as any).content === "string") lastText = (lastUser as any).content
      }
      const lastAssistant = [...msgs].reverse().find((m: any) => m.role === "assistant" && m.tokens)
      if (lastAssistant?.tokens) {
        const tk = lastAssistant.tokens
        ctxUsed = (tk.input || 0) + (tk.output || 0) + (tk.reasoning || 0) + (tk.cache?.read || 0) + (tk.cache?.write || 0)
      }
    } catch {}
    return getTask(lastText, ctxUsed)
  })

  const bestFree = createMemo(() => pickBest(task(), freeModels()))
  const bestPaid = createMemo(() => pickBest(task(), paidModels()))
  const bestGo = createMemo(() => pickBest(task(), goModels()))
  const bestOverall = createMemo(() =>
    pickBest(task(), [...freeModels(), ...goModels(), ...paidModels()].sort((a, b) => a.ctxTier - b.ctxTier || b.combinedScore - a.combinedScore)),
  )

  // Cheapest capable: lowest-cost model among those with capability >= 70% of bestOverall
  const cheapestCapableModel = createMemo(() => {
    const best = bestOverall()
    if (!best) return null
    const all = [...freeModels(), ...goModels(), ...paidModels()]
    const threshold = best.score * 0.7
    const capable = all.filter((m) => m.score >= threshold)
    if (capable.length < 2) return null
    const cheapest = [...capable].sort((a, b) => b.costScore - a.costScore)[0]
    if (!cheapest || cheapest.id === best.id) return null
    return cheapest
  })

  const t = () => theme()
  const L = "  "

  const scoreColor = (m: ModelEntry): any => {
    const s = m.combinedScore
    if (s >= 0.6) return t().success
    if (s >= 0.3) return t().warning
    return t().textMuted
  }

  const renderList = (list: ModelEntry[], bestId: string | null, color: any, collapsed: () => boolean, showCost: boolean, showGoLimit = false, colorByScore = false) => (
    <Show when={!collapsed()}>
      <Show when={list.length > 0} fallback={<text style={{ fg: t().textMuted }}>{L + "loading..."}</text>}>
        <box flexDirection="column">
          {list.map((m, i) => {
            const isBest = m.id === bestId
            return (
              <box flexDirection="column">
                <box flexDirection="row">
                  <text style={{ fg: isBest ? color : (colorByScore ? scoreColor(m) : t().textMuted) }}>{L + (i + 1) + "."}</text>
                  <text style={{ fg: isBest ? color : (colorByScore ? scoreColor(m) : t().text), fontWeight: isBest ? "bold" : undefined }}>
                    {" " + m.id + (isBest ? " ★" : "")}
                  </text>
                  <text style={{ fg: t().textMuted }}>{" " + Math.round(m.combinedScore * 100)}</text>
                </box>
                <Show when={m.name !== m.id}>
                  <text style={{ fg: t().textMuted }}>{L + "  " + m.name}</text>
                </Show>
                <box flexDirection="row">
                  <text style={{ fg: t().textMuted }}>{L + "  ctx " + fmtCtx(m.ctx) + "  kwn " + m.knowledge}</text>
                  <Show when={showCost}>
                    <text style={{ fg: isBest ? color : t().textMuted }}>{"  " + fmtCost(m.cost)}</text>
                  </Show>
                  <Show when={showGoLimit}>
                    <text style={{ fg: isBest ? color : t().textMuted }}>{"  " + fmtGoLimit(m)}</text>
                  </Show>
                </box>
                <text style={{ fg: t().textMuted }}>
                  {L + "  cap " + Math.round(m.score * 100) + "  eff " + Math.round(m.costScore * 100)}
                </text>
              </box>
            )
          })}
        </box>
      </Show>
    </Show>
  )

  return (
    <box flexDirection="column" paddingTop={1} paddingBottom={1} gap={1}>
      {/* Recommendation banner — green = best overall, yellow = best free, blue = best Go, gray = cheapest capable (each when different) */}
      <Show when={bestOverall()}>
        {(best) => {
          const free = bestFree()
          const go = bestGo()
          const cc = cheapestCapableModel()
          const bestTier = tierOf(best())
          const showFree = free && free.id !== best().id
          const showGo = go && go.id !== best().id && (!free || go.id !== free.id)
          const showCc = cc && cc.id !== best().id && (!free || cc.id !== free.id) && (!go || cc.id !== go.id)
          const tierLabel = bestTier === "free" ? "free ✓" : bestTier === "go" ? fmtGoLimit(best()) : fmtCost(best().cost)
          return (
            <box flexDirection="column" gap={0}>
              <box flexDirection="column" borderStyle="single" borderColor={t().success as any}>
                <box flexDirection="row">
                  <text style={{ fg: t().success }}>{"  ★ "}</text>
                  <text style={{ fg: t().success, fontWeight: "bold" }}>{best().id}</text>
                  <text style={{ fg: t().textMuted }}>{"  best"}</text>
                </box>
                <text style={{ fg: t().textMuted }}>{L + "task: " + task() + " — ctx " + fmtCtx(best().ctx) + "  kwn " + best().knowledge}</text>
                <text style={{ fg: t().textMuted }}>{L + tierLabel + "  (cap " + Math.round(best().score * 100) + " eff " + Math.round(best().costScore * 100) + ")"}</text>
              </box>
              <Show when={showFree && free}>
                {(f) => (
                  <box flexDirection="column" borderStyle="single" borderColor={t().warning as any}>
                    <box flexDirection="row">
                      <text style={{ fg: t().warning }}>{"  ◆ "}</text>
                      <text style={{ fg: t().warning, fontWeight: "bold" }}>{f().id}</text>
                      <text style={{ fg: t().textMuted }}>{"  best free"}</text>
                    </box>
                    <text style={{ fg: t().textMuted }}>{L + "ctx " + fmtCtx(f().ctx) + "  kwn " + f().knowledge + "  free ✓"}</text>
                  </box>
                )}
              </Show>
              <Show when={showGo && go}>
                {(g) => (
                  <box flexDirection="column" borderStyle="single" borderColor={t().info as any}>
                    <box flexDirection="row">
                      <text style={{ fg: t().info }}>{"  ● "}</text>
                      <text style={{ fg: t().info, fontWeight: "bold" }}>{g().id}</text>
                      <text style={{ fg: t().textMuted }}>{"  best Go"}</text>
                    </box>
                    <text style={{ fg: t().textMuted }}>{L + "ctx " + fmtCtx(g().ctx) + "  kwn " + g().knowledge + "  " + fmtGoLimit(g())}</text>
                  </box>
                )}
              </Show>
              <Show when={showCc && cc}>
                {(c) => (
                  <box flexDirection="column" borderStyle="single" borderColor={t().textMuted as any}>
                    <box flexDirection="row">
                      <text style={{ fg: t().textMuted }}>{"  ◇ "}</text>
                      <text style={{ fg: t().textMuted, fontWeight: "bold" }}>{c().id}</text>
                      <text style={{ fg: t().textMuted }}>{"  cheapest capable"}</text>
                    </box>
                    <text style={{ fg: t().textMuted }}>{L + "ctx " + fmtCtx(c().ctx) + "  kwn " + c().knowledge + "  " + (isFree(c()) ? "free ✓" : fmtCost(c().cost))}</text>
                  </box>
                )}
              </Show>
            </box>
          )
        }}
      </Show>

      {/* Free models — ranked by capability (all free, cost doesn't differentiate) */}
      <box flexDirection="row" gap={1} onMouseDown={() => setCollapsedFree((c) => !c)}>
        <text style={{ fg: t().textMuted }}>{collapsedFree() ? "\u25B6" : "\u25BC"}</text>
        <text style={{ fg: t().text, fontWeight: "bold" }}>Free Models</text>
        <text style={{ fg: t().textMuted }}>{freeModels().length}</text>
      </box>
      {renderList(
        freeModels(),
        (() => {
          const free = bestFree()
          const overall = bestOverall()
          if (!free) return null
          if (overall && isFree(overall) && overall.id === free.id) return free.id
          return free.id
        })(),
        (() => {
          const overall = bestOverall()
          const free = bestFree()
          if (overall && free && overall.id === free.id) return t().success
          return t().warning
        })(),
        collapsedFree,
        false,
      )}

      {/* Go models ($10/mo subscription) */}
      <box flexDirection="row" gap={1} onMouseDown={() => setCollapsedGo((c) => !c)}>
        <text style={{ fg: t().textMuted }}>{collapsedGo() ? "\u25B6" : "\u25BC"}</text>
        <text style={{ fg: t().text, fontWeight: "bold" }}>Go Models</text>
        <text style={{ fg: t().textMuted }}>{goModels().length}</text>
      </box>
      <Show when={!collapsedGo()}>
        <Show
          when={goModels().length > 0}
          fallback={<text style={{ fg: t().textMuted }}>{L + "/connect → OpenCode Go ($10/mo) to unlock"}</text>}
        >
          <text style={{ fg: t().textMuted }}>{L + "$10/mo sub, per-model monthly caps"}</text>
        </Show>
      </Show>
      {renderList(
        goModels(),
        (() => {
          const go = bestGo()
          const overall = bestOverall()
          if (!go) return null
          return go.id
        })(),
        (() => {
          const overall = bestOverall()
          const go = bestGo()
          if (overall && go && overall.id === go.id) return t().success
          return t().info
        })(),
        collapsedGo,
        false,
        true,
      )}

      {/* Paid models */}
      <box flexDirection="row" gap={1} onMouseDown={() => setCollapsedPaid((c) => !c)}>
        <text style={{ fg: t().textMuted }}>{collapsedPaid() ? "\u25B6" : "\u25BC"}</text>
        <text style={{ fg: t().text, fontWeight: "bold" }}>Paid Models</text>
        <text style={{ fg: t().textMuted }}>{paidModels().length}</text>
      </box>
      {renderList(
        paidModels(),
        (() => {
          const overall = bestOverall()
          if (overall && !isFree(overall) && (overall as any).provider !== "opencode-go") return overall.id
          return null
        })(),
        t().success,
        collapsedPaid,
        true,
        false,
        true,
      )}
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 600,
    slots: {
      sidebar_content(_ctx: unknown, props: { session_id: string }) {
        return <FreeModelsView api={api} sessionID={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: PLUGIN_ID,
  tui,
}

export default plugin
