import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import './App.css'
import { Youngjoon } from './components/Youngjoon'
import {
  AUTOS,
  autoCost,
  FEVER_MULT,
  fmt,
  IDLE_LINES,
  pick,
  RAGE_LINES,
  RAGE_MAX,
  rankFor,
  TOOLS,
} from './game/data'
import { playBuy, playHit, playRage } from './game/sound'
import { autoRate, inFever, moodOf, rageLevel, useGame } from './game/useGame'

interface Floater {
  id: number
  x: number
  y: number
  text: string
  emoji: string
}

interface Bubble {
  text: string
  until: number
  key: number
}

let floaterId = 0

export default function App() {
  const [s, dispatch] = useGame()
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const stageRef = useRef<HTMLButtonElement>(null)

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

  function hit(clientX?: number, clientY?: number) {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2
    const now = Date.now()
    const gain = tool.power * (fever ? FEVER_MULT : 1)
    const f: Floater = {
      id: ++floaterId,
      x: x + (Math.random() * 30 - 15),
      y,
      text: `+${fmt(gain)}`,
      emoji: tool.emoji,
    }
    setFloaters((list) => [...list.slice(-24), f])
    window.setTimeout(
      () => setFloaters((list) => list.filter((it) => it.id !== f.id)),
      900,
    )
    // 도구를 바꿨으면 이전 도구의 대사가 남지 않도록 바로 교체
    const switched = s.hitSeq > 0 && s.lastTool !== tool.id
    if (!fever && (!bubbleVisible || switched || Math.random() < 0.3)) {
      say(pick(tool.lines), 1500)
    }
    if (!s.muted) playHit(tool.id)
    dispatch({ type: 'hit', now })
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    hit(e.clientX, e.clientY)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!e.repeat) hit()
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
          <button
            ref={stageRef}
            type="button"
            className="stage"
            data-tool={tool.id}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            aria-label={`${tool.name}로 이영준 일병 괴롭히기`}
          >
            {bubbleVisible && (
              <span key={bubble.key} className="bubble" aria-live="polite">
                {bubble.text}
              </span>
            )}
            <span
              key={s.hitSeq}
              className={`yj ${s.hitSeq > 0 && s.now - s.lastHitAt < 650 ? `anim-${s.lastTool}` : ''}`}
            >
              <span className={`yj-inner${mood === 'sleepy' ? ' is-sleepy' : ''}${fever ? ' is-rage' : ''}`}>
                <Youngjoon mood={mood} blush={s.blush} bump={s.now < s.bumpUntil} />
              </span>
            </span>
            {floaters.map((f) => (
              <span
                key={f.id}
                className="floater"
                style={{ left: f.x, top: f.y }}
                aria-hidden="true"
              >
                <span className="floater-emoji">{f.emoji}</span>
                {f.text}
              </span>
            ))}
          </button>

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
              빠르게 괴롭히면 게이지가 차고, 꽉 차면 이영준 일병이 폭발해요.
              폭발한 동안엔 포인트가 {FEVER_MULT}배!
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
