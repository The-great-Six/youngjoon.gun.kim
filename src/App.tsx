import {
  type KeyboardEvent,
  lazy,
  type PointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import './App.css'
import {
  AUTOS,
  autoCost,
  FEVER_MULT,
  fmt,
  IDLE_LINES,
  PART_LINES,
  PART_NAME,
  type Part,
  pick,
  RAGE_LINES,
  RAGE_MAX,
  rankFor,
  TOOLS,
  WEAK_MULT,
} from './game/data'
import { playBuy, playHit, playRage } from './game/sound'
import { frontOf, type HitInfo, isResting, type ViewState } from './game/view'
import {
  autoRate,
  hitGain,
  inFever,
  moodOf,
  rageLevel,
  useGame,
} from './game/useGame'

// three.js는 덩치가 커서 따로 불러온다
const Youngjoon3D = lazy(() => import('./components/Youngjoon3D'))

interface Floater {
  id: number
  x: number
  y: number
  text: string
  emoji: string
  weak: boolean
}

interface Bubble {
  text: string
  until: number
  key: number
}

let floaterId = 0

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [s, dispatch] = useGame()
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [webgl] = useState(hasWebGL)
  const [hitFx, setHitFx] = useState<HitInfo>({
    seq: 0,
    tool: 'poke',
    part: 'face',
    side: 0,
  })
  const stageRef = useRef<HTMLDivElement>(null)
  const view = useRef<ViewState>({ yaw: 0, dragging: false, lastDragAt: 0 })
  const drag = useRef<{ id: number; x: number; yaw: number } | null>(null)

  const mood = moodOf(s)
  const fever = inFever(s)
  const rate = autoRate(s.autos)
  const tool = TOOLS.find((t) => t.id === s.selected) ?? TOOLS[0]

  const say = (text: string, ms: number) =>
    setBubble({ text, until: Date.now() + ms, key: Date.now() })

  // 폭발 순간
  const prevRage = useRef(s.rageCount)
  useEffect(() => {
    if (s.rageCount > prevRage.current) {
      say(pick(RAGE_LINES), 2600)
      if (!s.muted) playRage()
    }
    prevRage.current = s.rageCount
  }, [s.rageCount, s.muted])

  // 졸기 시작하면 혼잣말
  const wasSleepy = useRef(false)
  useEffect(() => {
    const sleepy = mood === 'sleepy'
    if (sleepy && !wasSleepy.current) say(pick(IDLE_LINES), 2600)
    wasSleepy.current = sleepy
  }, [mood])

  const bubbleVisible = bubble && bubble.until > s.now

  function hit(part: Part, clientX?: number, clientY?: number, side = 0) {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height * 0.4
    const now = Date.now()
    const weak = tool.weak === part
    const f: Floater = {
      id: ++floaterId,
      x: x + (Math.random() * 30 - 15),
      y,
      text: `${weak ? '급소! ' : ''}+${fmt(hitGain(s, part, now))}`,
      emoji: tool.emoji,
      weak,
    }
    setFloaters((list) => [...list.slice(-24), f])
    window.setTimeout(
      () => setFloaters((list) => list.filter((it) => it.id !== f.id)),
      900,
    )

    // 도구나 부위가 바뀌면 이전 대사가 남지 않도록 바로 교체
    const changed =
      hitFx.seq > 0 && (hitFx.tool !== tool.id || hitFx.part !== part)
    if (!fever && (!bubbleVisible || changed || Math.random() < 0.3)) {
      const partLines = PART_LINES[part]
      const lines =
        partLines && !weak && Math.random() < 0.6 ? partLines : tool.lines
      say(pick(lines), 1500)
    }
    if (!s.muted) playHit(tool.id)
    setHitFx({ seq: hitFx.seq + 1, tool: tool.id, part, side })
    dispatch({ type: 'hit', now, part })
  }

  // 3D 장면이 매 틱마다 다시 그려지지 않도록 콜백 참조를 고정한다
  const hitRef = useRef(hit)
  useEffect(() => {
    hitRef.current = hit
  })
  const onHit = useCallback(
    (part: Part, x: number, y: number, side: number) =>
      hitRef.current(part, x, y, side),
    [],
  )

  // 드래그로 좌우 회전
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    // 정면으로 돌아와 있었다면 거기서부터 다시 돌린다
    if (isResting(view.current)) view.current.yaw = frontOf(view.current.yaw)
    drag.current = { id: e.pointerId, x: e.clientX, yaw: view.current.yaw }
    view.current.lastDragAt = performance.now()
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!view.current.dragging && Math.abs(dx) < 6) return
    if (!view.current.dragging) e.currentTarget.setPointerCapture(e.pointerId)
    view.current.dragging = true
    view.current.yaw = d.yaw + dx * 0.012
    view.current.lastDragAt = performance.now()
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    view.current.dragging = false
    view.current.lastDragAt = performance.now()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!e.repeat) hit('face')
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      if (isResting(view.current)) view.current.yaw = frontOf(view.current.yaw)
      view.current.yaw += e.key === 'ArrowLeft' ? -0.35 : 0.35
      view.current.lastDragAt = performance.now()
    }
  }

  const rage = rageLevel(s)

  return (
    <div className={`app${fever ? ' is-fever' : ''}`}>
      <header className="top">
        <div className="title">
          <span className="eyebrow">제1장난대대</span>
          <h1>이영준 일병 괴롭히기</h1>
        </div>
        <dl className="stats">
          <div>
            <dt>장난 포인트</dt>
            <dd className="big">{fmt(s.points)}</dd>
          </div>
          <div>
            <dt>초당</dt>
            <dd>{fmt(rate * (fever ? FEVER_MULT : 1))}</dd>
          </div>
          <div>
            <dt>내 계급</dt>
            <dd>{rankFor(s.total)}</dd>
          </div>
        </dl>
      </header>

      <main className="layout">
        <section className="stage-wrap" aria-label="이영준 일병">
          <div
            ref={stageRef}
            className="stage"
            data-last-part={hitFx.seq > 0 ? hitFx.part : undefined}
            role="button"
            tabIndex={0}
            aria-label={`${tool.name}로 이영준 일병 괴롭히기. 좌우 화살표로 돌려 보기`}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {webgl ? (
              <Suspense
                fallback={<span className="stage-msg">이영준 일병 호출 중…</span>}
              >
                <Youngjoon3D
                  mood={mood}
                  blush={Math.round(s.blush * 20) / 20}
                  bump={s.now < s.bumpUntil}
                  fever={fever}
                  hit={hitFx}
                  view={view}
                  onHit={onHit}
                />
              </Suspense>
            ) : (
              <span className="stage-msg">
                이 브라우저는 3D(WebGL)를 지원하지 않아요.
              </span>
            )}
            {bubbleVisible && (
              <span key={bubble.key} className="bubble" aria-live="polite">
                {bubble.text}
              </span>
            )}
            {floaters.map((f) => (
              <span
                key={f.id}
                className={`floater${f.weak ? ' is-weak' : ''}`}
                style={{ left: f.x, top: f.y }}
                aria-hidden="true"
              >
                <span className="floater-emoji">{f.emoji}</span>
                {f.text}
              </span>
            ))}
          </div>

          <div className="rage">
            <div className="rage-label">
              <span>{fever ? `💢 폭발! 포인트 ${FEVER_MULT}배` : '짜증 게이지'}</span>
              <span>
                {fever ? '' : `${Math.floor((rage / RAGE_MAX) * 100)}%`}
              </span>
            </div>
            <div
              className="rage-bar"
              role="progressbar"
              aria-label="짜증 게이지"
              aria-valuemin={0}
              aria-valuemax={RAGE_MAX}
              aria-valuenow={Math.round(rage)}
            >
              <div className="rage-fill" style={{ width: `${(rage / RAGE_MAX) * 100}%` }} />
            </div>
            <p className="hint">
              드래그하면 이영준 일병을 돌려 볼 수 있어요. 도구마다 급소가 있어서
              거기를 맞히면 포인트가 {WEAK_MULT}배! 게이지가 꽉 차면 폭발해서{' '}
              {FEVER_MULT}배가 더 붙어요.
            </p>
          </div>
        </section>

        <section className="panel">
          <h2>장난 도구</h2>
          <ul className="tools">
            {TOOLS.map((t) => {
              const owned = s.owned.includes(t.id)
              const selected = s.selected === t.id
              const affordable = s.points >= t.cost
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`tool${selected ? ' is-selected' : ''}${owned ? '' : ' is-locked'}`}
                    disabled={!owned && !affordable}
                    aria-pressed={owned ? selected : undefined}
                    onClick={() => {
                      if (owned) dispatch({ type: 'select', tool: t.id })
                      else {
                        if (!s.muted) playBuy()
                        dispatch({ type: 'buyTool', tool: t.id })
                      }
                    }}
                  >
                    <span className="tool-emoji" aria-hidden="true">
                      {t.emoji}
                    </span>
                    <span className="tool-name">{t.name}</span>
                    <span className="tool-meta">
                      {owned ? `+${t.power} / 클릭` : `🔒 ${fmt(t.cost)}`}
                    </span>
                    <span className="tool-weak">급소 {PART_NAME[t.weak]}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <h2>자동 장난</h2>
          <ul className="autos">
            {AUTOS.map((a) => {
              const count = s.autos[a.id]
              const cost = autoCost(a, count)
              const affordable = s.points >= cost
              const visible = count > 0 || s.total >= a.baseCost * 0.4
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`auto${visible ? '' : ' is-hidden'}`}
                    disabled={!affordable}
                    onClick={() => {
                      if (!s.muted) playBuy()
                      dispatch({ type: 'buyAuto', auto: a.id })
                    }}
                  >
                    <span className="auto-emoji" aria-hidden="true">
                      {visible ? a.emoji : '❔'}
                    </span>
                    <span className="auto-body">
                      <span className="auto-name">
                        {visible ? a.name : '???'}
                        {count > 0 && <span className="auto-count">×{count}</span>}
                      </span>
                      <span className="auto-desc">
                        {visible ? `${a.desc} · 초당 +${a.rate}` : '포인트를 더 모아 보세요'}
                      </span>
                    </span>
                    <span className="auto-cost">{fmt(cost)}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <footer className="foot">
            <span>
              괴롭힌 횟수 {s.clicks.toLocaleString('ko-KR')} · 폭발시킨 횟수 {s.rageCount}
            </span>
            <span className="foot-actions">
              <button type="button" className="ghost" onClick={() => dispatch({ type: 'toggleMute' })}>
                {s.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}
              </button>
              {confirmReset ? (
                <>
                  <button
                    type="button"
                    className="ghost danger"
                    onClick={() => {
                      dispatch({ type: 'reset', now: Date.now() })
                      setConfirmReset(false)
                    }}
                  >
                    정말 초기화
                  </button>
                  <button type="button" className="ghost" onClick={() => setConfirmReset(false)}>
                    취소
                  </button>
                </>
              ) : (
                <button type="button" className="ghost" onClick={() => setConfirmReset(true)}>
                  처음부터
                </button>
              )}
            </span>
          </footer>
        </section>
      </main>
    </div>
  )
}
