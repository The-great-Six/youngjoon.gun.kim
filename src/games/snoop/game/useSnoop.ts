import { useEffect, useReducer } from 'react'
import { drawItem, ITEMS, type LineId, SPOTS } from './items'

const STORAGE_KEY = 'youngjoon-snoop-v1'

export const MAX_STRIKES = 3
/** 돌아보기 시작한 뒤 이만큼은 봐준다 (몸이 도는 시간) */
const GRACE_MS = 220
const CAUGHT_MS = 1900

/**
 * ready: 시작 전 · away: 등 돌림 · warn: 돌아볼 낌새 · look: 이쪽을 봄
 * caught: 들킴 · reveal: 물건 확인 중(시간 멈춤) · over: 판 종료
 */
export type Phase = 'ready' | 'away' | 'warn' | 'look' | 'caught' | 'reveal' | 'over'

export interface Reveal {
  id: string
  isNew: boolean
  /** 이 물건으로 완성된 라인. 있으면 물건 다음에 엔딩을 보여 준다. */
  ending?: LineId
  step: 'item' | 'ending'
}

export interface SnoopState {
  // 저장되는 것
  found: string[]
  rounds: number
  muted: boolean
  // 한 판의 상태
  phase: Phase
  phaseAt: number
  phaseUntil: number
  /** 지금의 낌새가 속임수인지 */
  fake: boolean
  holding: number | null
  holdAt: number
  progress: number[]
  strikes: number
  roundFound: string[]
  roundNew: number
  reveal: Reveal | null
  now: number
}

type Action =
  | { type: 'start'; now: number; r: number }
  | { type: 'tick'; now: number; r1: number; r2: number; r3: number }
  | { type: 'hold'; spot: number; now: number }
  | { type: 'release' }
  | { type: 'next'; now: number; r: number }
  | { type: 'toggleMute' }
  | { type: 'wipe'; now: number }

// 물건을 찾을수록 영준이가 예민해진다
const awayMs = (alert: number, r: number) =>
  Math.max(1300, (2600 + r * 2600) * 0.93 ** alert)
const warnMs = (alert: number) => Math.max(450, 850 - alert * 30)
const lookMs = (r: number) => 1100 + r * 900
const fakeChance = (alert: number) => Math.min(0.35, alert * 0.06)

function fresh(now: number): SnoopState {
  return {
    found: [],
    rounds: 0,
    muted: false,
    phase: 'ready',
    phaseAt: now,
    phaseUntil: 0,
    fake: false,
    holding: null,
    holdAt: 0,
    progress: SPOTS.map(() => 0),
    strikes: 0,
    roundFound: [],
    roundNew: 0,
    reveal: null,
    now,
  }
}

function load(): SnoopState {
  const base = fresh(Date.now())
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<SnoopState>
    return {
      ...base,
      found: (saved.found ?? []).filter((id) => ITEMS.some((i) => i.id === id)),
      rounds: Number(saved.rounds) || 0,
      muted: Boolean(saved.muted),
    }
  } catch {
    return base
  }
}

function save({ found, rounds, muted }: SnoopState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ found, rounds, muted }))
  } catch {
    // 저장 불가 환경(시크릿 창 등)은 그냥 무시
  }
}

const setAt = (list: number[], i: number, v: number) =>
  list.map((x, k) => (k === i ? v : x))

function reducer(s: SnoopState, a: Action): SnoopState {
  switch (a.type) {
    case 'start':
      return {
        ...fresh(a.now),
        found: s.found,
        rounds: s.rounds,
        muted: s.muted,
        phase: 'away',
        phaseUntil: a.now + 3000 + a.r * 1500,
      }

    case 'hold':
      if (s.phase !== 'away' && s.phase !== 'warn' && s.phase !== 'look') return s
      return { ...s, holding: a.spot, holdAt: a.now }

    case 'release':
      return s.holding === null ? s : { ...s, holding: null }

    case 'next': {
      if (s.phase !== 'reveal' || !s.reveal) return s
      if (s.reveal.step === 'item' && s.reveal.ending) {
        return { ...s, reveal: { ...s.reveal, step: 'ending' } }
      }
      return {
        ...s,
        reveal: null,
        phase: 'away',
        phaseAt: a.now,
        phaseUntil: a.now + awayMs(s.roundFound.length, a.r),
        now: a.now,
      }
    }

    case 'toggleMute':
      return { ...s, muted: !s.muted }

    case 'wipe':
      return { ...fresh(a.now), muted: s.muted }

    case 'tick': {
      if (s.phase === 'ready' || s.phase === 'reveal' || s.phase === 'over') {
        return s
      }
      const dt = Math.max(0, Math.min(0.2, (a.now - s.now) / 1000))
      let n: SnoopState = { ...s, now: a.now }
      const alert = n.roundFound.length

      // 등 돌린 동안에만 수색이 진행된다
      if (n.holding !== null && (n.phase === 'away' || n.phase === 'warn')) {
        const spot = SPOTS[n.holding]
        const p = n.progress[n.holding] + dt / spot.seconds
        if (p >= 1) {
          const item = drawItem(spot, n.found, a.r1)
          const isNew = !n.found.includes(item.id)
          return {
            ...n,
            progress: setAt(n.progress, n.holding, 0),
            holding: null,
            phase: 'reveal',
            phaseAt: a.now,
            found: isNew ? [...n.found, item.id] : n.found,
            roundFound: [...n.roundFound, item.id],
            roundNew: n.roundNew + (isNew ? 1 : 0),
            reveal: {
              id: item.id,
              isNew,
              ending: item.finale && isNew ? item.line : undefined,
              step: 'item',
            },
          }
        }
        n = { ...n, progress: setAt(n.progress, n.holding, p) }
      }

      switch (n.phase) {
        case 'away':
          if (a.now < n.phaseUntil) return n
          return {
            ...n,
            phase: 'warn',
            phaseAt: a.now,
            phaseUntil: a.now + warnMs(alert),
            fake: a.r2 < fakeChance(alert),
          }
        case 'warn':
          if (a.now < n.phaseUntil) return n
          return n.fake
            ? { ...n, phase: 'away', phaseAt: a.now, phaseUntil: a.now + awayMs(alert, a.r3), fake: false }
            : { ...n, phase: 'look', phaseAt: a.now, phaseUntil: a.now + lookMs(a.r3) }
        case 'look':
          if (
            n.holding !== null &&
            a.now >= Math.max(n.phaseAt + GRACE_MS, n.holdAt + 80)
          ) {
            return {
              ...n,
              phase: 'caught',
              phaseAt: a.now,
              phaseUntil: a.now + CAUGHT_MS,
              strikes: n.strikes + 1,
              progress: setAt(n.progress, n.holding, 0),
              holding: null,
            }
          }
          if (a.now < n.phaseUntil) return n
          return { ...n, phase: 'away', phaseAt: a.now, phaseUntil: a.now + awayMs(alert, a.r3) }
        case 'caught':
          if (a.now < n.phaseUntil) return n
          return n.strikes >= MAX_STRIKES
            ? { ...n, phase: 'over', phaseAt: a.now, rounds: n.rounds + 1 }
            : { ...n, phase: 'away', phaseAt: a.now, phaseUntil: a.now + awayMs(alert, a.r3) }
        default:
          return n
      }
    }
  }
}

export function useSnoop() {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    const id = window.setInterval(
      () =>
        dispatch({
          type: 'tick',
          now: Date.now(),
          r1: Math.random(),
          r2: Math.random(),
          r3: Math.random(),
        }),
      50,
    )
    return () => window.clearInterval(id)
  }, [])

  const { found, rounds, muted } = state
  useEffect(() => {
    save({ found, rounds, muted } as SnoopState)
  }, [found, rounds, muted])

  return [state, dispatch] as const
}
