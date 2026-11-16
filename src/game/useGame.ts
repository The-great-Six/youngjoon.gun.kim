import { useEffect, useReducer, useRef } from 'react'
import {
  AUTOS,
  type AutoId,
  autoCost,
  FEVER_MS,
  FEVER_MULT,
  IDLE_MS,
  type Mood,
  RAGE_DECAY_PER_SEC,
  RAGE_MAX,
  TOOLS,
  type ToolId,
} from './data'

const STORAGE_KEY = 'youngjoon-poke-v1'

export interface GameState {
  points: number
  total: number
  clicks: number
  owned: ToolId[]
  autos: Record<AutoId, number>
  selected: ToolId
  muted: boolean
  // 아래는 저장하지 않는 순간 상태
  rage: number
  feverUntil: number
  rageCount: number
  now: number
  lastHitAt: number
  lastTool: ToolId
  hitSeq: number
  blush: number
  bumpUntil: number
}

type Action =
  | { type: 'hit'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'select'; tool: ToolId }
  | { type: 'buyTool'; tool: ToolId }
  | { type: 'buyAuto'; auto: AutoId }
  | { type: 'toggleMute' }
  | { type: 'reset'; now: number }

const emptyAutos = (): Record<AutoId, number> =>
  Object.fromEntries(AUTOS.map((a) => [a.id, 0])) as Record<AutoId, number>

function fresh(now: number): GameState {
  return {
    points: 0,
    total: 0,
    clicks: 0,
    owned: ['poke'],
    autos: emptyAutos(),
    selected: 'poke',
    muted: false,
    rage: 0,
    feverUntil: 0,
    rageCount: 0,
    now,
    lastHitAt: now - 1000,
    lastTool: 'poke',
    hitSeq: 0,
    blush: 0,
    bumpUntil: 0,
  }
}

function load(): GameState {
  const now = Date.now()
  const base = fresh(now)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<GameState>
    const owned = (saved.owned ?? []).filter((id) =>
      TOOLS.some((t) => t.id === id),
    )
    return {
      ...base,
      points: Number(saved.points) || 0,
      total: Number(saved.total) || 0,
      clicks: Number(saved.clicks) || 0,
      owned: owned.includes('poke') ? owned : ['poke', ...owned],
      autos: { ...base.autos, ...saved.autos },
      selected:
        saved.selected && owned.includes(saved.selected)
          ? saved.selected
          : 'poke',
      muted: Boolean(saved.muted),
    }
  } catch {
    return base
  }
}

function save(s: GameState) {
  try {
    const { points, total, clicks, owned, autos, selected, muted } = s
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ points, total, clicks, owned, autos, selected, muted }),
    )
  } catch {
    // 저장 불가 환경(시크릿 창 등)은 그냥 무시
  }
}

export function autoRate(autos: Record<AutoId, number>): number {
  return AUTOS.reduce((sum, a) => sum + a.rate * (autos[a.id] ?? 0), 0)
}

export function inFever(s: GameState): boolean {
  return s.now < s.feverUntil
}

export function rageLevel(s: GameState): number {
  if (inFever(s)) return ((s.feverUntil - s.now) / FEVER_MS) * RAGE_MAX
  return s.rage
}

export function moodOf(s: GameState): Mood {
  if (inFever(s)) return 'angry'
  if (s.now - s.lastHitAt < 650) {
    return TOOLS.find((t) => t.id === s.lastTool)?.mood ?? 'surprised'
  }
  if (s.now - Math.max(s.lastHitAt, s.feverUntil) > IDLE_MS) return 'sleepy'
  if (s.rage > 60) return 'annoyed'
  return 'calm'
}

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'hit': {
      const tool = TOOLS.find((t) => t.id === s.selected) ?? TOOLS[0]
      const fever = a.now < s.feverUntil
      const gain = tool.power * (fever ? FEVER_MULT : 1)
      let rage = fever ? s.rage : s.rage + tool.annoy
      let feverUntil = s.feverUntil
      let rageCount = s.rageCount
      if (!fever && rage >= RAGE_MAX) {
        rage = 0
        feverUntil = a.now + FEVER_MS
        rageCount += 1
      }
      return {
        ...s,
        now: a.now,
        points: s.points + gain,
        total: s.total + gain,
        clicks: s.clicks + 1,
        rage,
        feverUntil,
        rageCount,
        lastHitAt: a.now,
        lastTool: tool.id,
        hitSeq: s.hitSeq + 1,
        blush: tool.id === 'pinch' ? Math.min(1, s.blush + 0.3) : s.blush,
        bumpUntil: tool.id === 'flick' ? a.now + 2500 : s.bumpUntil,
      }
    }
    case 'tick': {
      const dt = Math.max(0, Math.min(1, (a.now - s.now) / 1000))
      const fever = a.now < s.feverUntil
      const earned = autoRate(s.autos) * dt * (fever ? FEVER_MULT : 1)
      return {
        ...s,
        now: a.now,
        points: s.points + earned,
        total: s.total + earned,
        rage: fever ? s.rage : Math.max(0, s.rage - RAGE_DECAY_PER_SEC * dt),
        blush: Math.max(0, s.blush - 0.35 * dt),
      }
    }
    case 'select':
      return s.owned.includes(a.tool) ? { ...s, selected: a.tool } : s
    case 'buyTool': {
      const tool = TOOLS.find((t) => t.id === a.tool)
      if (!tool || s.owned.includes(tool.id) || s.points < tool.cost) return s
      return {
        ...s,
        points: s.points - tool.cost,
        owned: [...s.owned, tool.id],
        selected: tool.id,
      }
    }
    case 'buyAuto': {
      const auto = AUTOS.find((x) => x.id === a.auto)
      if (!auto) return s
      const cost = autoCost(auto, s.autos[auto.id])
      if (s.points < cost) return s
      return {
        ...s,
        points: s.points - cost,
        autos: { ...s.autos, [auto.id]: s.autos[auto.id] + 1 },
      }
    }
    case 'toggleMute':
      return { ...s, muted: !s.muted }
    case 'reset':
      return { ...fresh(a.now), muted: s.muted }
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const latest = useRef(state)

  useEffect(() => {
    latest.current = state
  })

  useEffect(() => {
    const tick = window.setInterval(
      () => dispatch({ type: 'tick', now: Date.now() }),
      100,
    )
    // 2초마다, 그리고 탭을 떠날 때 저장
    const autosave = window.setInterval(() => save(latest.current), 2000)
    const onHide = () => save(latest.current)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.clearInterval(tick)
      window.clearInterval(autosave)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  return [state, dispatch] as const
}
