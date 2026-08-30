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
  if (inp !== null && out !== null) return `$${f(inp)}/$${f(out)}/1M in/out`
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

function scoreModel(model: any): { score: number; knowledge: string; ctx: number } {
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
  return {
    score: knowledgeScore * 0.6 + ctxScore * 0.4,
    knowledge: knowledgeMonths > 0 ? k : "n/a",
    ctx,
  }
}

type ModelEntry = { id: string; name: string; score: number; knowledge: string; ctx: number; reasoning: boolean; family: string; cost: any; provider: string }

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
  if (task === "long context") return [...list].sort((a, b) => b.ctx - a.ctx)[0]
  if (task === "speed") {
    const flash = list.find((m) => /flash/i.test(m.id))
    return flash || list[0]
  }
  if (task === "reasoning") {
    const cand = list.filter((m) => m.reasoning)
    return (cand.length ? cand : list).sort((a, b) => b.score - a.score)[0]
  }
  if (task === "code") {
    const cand = list.find((m) => /code/i.test(m.id))
    return cand || list[0]
  }
  return list[0]
}

function FreeModelsView(props: { api: Parameters<TuiPlugin>[0]; sessionID: string }) {
  const theme = () => props.api.theme.current
  const [collapsedFree, setCollapsedFree] = createSignal(false)
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
        const s = scoreModel(m)
        list.push({
          id: id.includes("/") ? id : `${(p as any).id}/${id}`,
          name: typeof m?.name === "string" ? m.name : id,
          reasoning: Boolean(m?.reasoning),
          family: String(m?.family || ""),
          cost: m?.cost,
          provider: (p as any).id,
          ...s,
        } as ModelEntry)
      }
    }
    return list
  })

  const freeModels = createMemo(() => allModels().filter((m) => (m as any).provider === "opencode" && isFree(m)).sort((a, b) => b.score - a.score))
  const paidModels = createMemo(() => allModels().filter((m) => !isFree(m)).sort((a, b) => b.score - a.score))

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
  const bestOverall = createMemo(() => pickBest(task(), [...freeModels(), ...paidModels()].sort((a, b) => b.score - a.score)))

  const t = () => theme()
  const L = "  "

  const renderList = (list: ModelEntry[], bestId: string | null, color: any, collapsed: () => boolean, showCost: boolean) => (
    <Show when={!collapsed()}>
      <Show when={list.length > 0} fallback={<text style={{ fg: t().textMuted }}>{L + "loading..."}</text>}>
        <box flexDirection="column">
          {list.map((m, i) => {
            const isBest = m.id === bestId
            return (
              <box flexDirection="column">
                <box flexDirection="row">
                  <text style={{ fg: isBest ? color : t().textMuted }}>{L + (i + 1) + "."}</text>
                  <text style={{ fg: isBest ? color : t().text, fontWeight: isBest ? "bold" : undefined }}>
                    {" " + m.id + (isBest ? " ★" : "")}
                  </text>
                  <text style={{ fg: t().textMuted }}>{" " + Math.round(m.score * 100)}</text>
                </box>
                <Show when={m.name !== m.id}>
                  <text style={{ fg: t().textMuted }}>{L + "  " + m.name}</text>
                </Show>
                <box flexDirection="row">
                  <text style={{ fg: t().textMuted }}>{L + "  ctx " + fmtCtx(m.ctx) + "  kwn " + m.knowledge}</text>
                  <Show when={showCost}>
                    <text style={{ fg: isBest ? color : t().textMuted }}>{"  " + fmtCost(m.cost)}</text>
                  </Show>
                </box>
              </box>
            )
          })}
        </box>
      </Show>
    </Show>
  )

  return (
    <box flexDirection="column" paddingTop={1} paddingBottom={1} gap={1}>
      {/* Recommendation banner — green = best overall, yellow = best free (when different) */}
      <Show when={bestOverall()}>
        {(best) => {
          const free = bestFree()
          const isFreeBest = free?.id === best().id
          return (
            <box flexDirection="column" gap={0}>
              <box flexDirection="column" borderStyle="single" borderColor={t().success as any}>
                <box flexDirection="row">
                  <text style={{ fg: t().success }}>{"  ★ "}</text>
                  <text style={{ fg: t().success, fontWeight: "bold" }}>{best().id}</text>
                  <text style={{ fg: t().textMuted }}>{"  best"}</text>
                </box>
                <text style={{ fg: t().textMuted }}>{L + "task: " + task() + " — ctx " + fmtCtx(best().ctx) + " kwn " + best().knowledge}</text>
                <text style={{ fg: t().textMuted }}>{L + (isFree(best()) ? "free ✓" : fmtCost(best().cost))}</text>
              </box>
              <Show when={!isFreeBest && free}>
                {(f) => (
                  <box flexDirection="column" borderStyle="single" borderColor={t().warning as any}>
                    <box flexDirection="row">
                      <text style={{ fg: t().warning }}>{"  ◆ "}</text>
                      <text style={{ fg: t().warning, fontWeight: "bold" }}>{f().id}</text>
                      <text style={{ fg: t().textMuted }}>{"  best free"}</text>
                    </box>
                    <text style={{ fg: t().textMuted }}>{L + "ctx " + fmtCtx(f().ctx) + " kwn " + f().knowledge + "  free ✓"}</text>
                  </box>
                )}
              </Show>
            </box>
          )
        }}
      </Show>

      {/* Free models */}
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
          if (overall && !isFree(overall)) return overall.id
          return null
        })(),
        t().success,
        collapsedPaid,
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
