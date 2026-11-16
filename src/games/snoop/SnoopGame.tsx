import { type KeyboardEvent, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import './SnoopGame.css'
import {
  GRADE_NAME,
  ITEMS,
  LINES,
  LINES_AWAY,
  LINES_CAUGHT,
  LINES_CLEAR,
  LINES_WARN,
  pick,
  SPOTS,
} from './game/items'
import { playCaught, playEnding, playFound, playRummage, playWarn } from './game/sound'
import { MAX_STRIKES, type Phase, useSnoop } from './game/useSnoop'

const SnoopScene = lazy(() => import('./components/SnoopScene'))

interface Bubble {
  text: string
  until: number
  key: number
}

const STATUS: Partial<Record<Phase, { text: string; tone: 'safe' | 'warn' | 'danger' }>> = {
  away: { text: '등 돌림 · 지금 뒤지세요', tone: 'safe' },
  warn: { text: '낌새가 이상하다...', tone: 'warn' },
  look: { text: '보는 중 · 손 떼세요!', tone: 'danger' },
  caught: { text: '들켰다!', tone: 'danger' },
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function SnoopGame() {
  const [s, dispatch] = useSnoop()
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [webgl] = useState(hasWebGL)

  const searching = s.holding !== null && (s.phase === 'away' || s.phase === 'warn')
  const muted = s.muted

  // 단계가 바뀔 때의 대사와 효과음
  const prevPhase = useRef<Phase>(s.phase)
  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = s.phase
    if (prev === s.phase) return
    const say = (text: string, ms: number) =>
      setBubble({ text, until: Date.now() + ms, key: Date.now() })
    switch (s.phase) {
      case 'warn':
        say(pick(LINES_WARN), 1200)
        if (!muted) playWarn()
        break
      case 'caught':
        say(pick(LINES_CAUGHT), 1900)
        if (!muted) playCaught()
        break
      case 'away':
        if (prev === 'look') say(pick(LINES_CLEAR), 1500)
        else if (prev !== 'warn' && Math.random() < 0.7) say(pick(LINES_AWAY), 1800)
        break
    }
  }, [s.phase, muted])

  // 물건이나 엔딩이 나올 때
  const mutedRef = useRef(muted)
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  const reveal = s.reveal
  useEffect(() => {
    if (!reveal || mutedRef.current) return
    if (reveal.step === 'ending') playEnding()
    else playFound(reveal.isNew)
  }, [reveal])

  // 뒤적이는 소리
  useEffect(() => {
    if (!searching || muted) return
    const id = window.setInterval(playRummage, 170)
    return () => window.clearInterval(id)
  }, [searching, muted])

  // 어디서 손을 떼든 수색을 멈춘다
  useEffect(() => {
    const release = () => dispatch({ type: 'release' })
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
    }
  }, [dispatch])

  const hold = useCallback(
    (spot: number) => dispatch({ type: 'hold', spot, now: Date.now() }),
    [dispatch],
  )

  function onSpotKey(e: KeyboardEvent<HTMLButtonElement>, spot: number, down: boolean) {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.preventDefault()
    if (!down) dispatch({ type: 'release' })
    else if (!e.repeat) hold(spot)
  }

  const bubbleVisible = bubble && bubble.until > s.now
  const status = STATUS[s.phase]
  const revealItem = s.reveal ? ITEMS.find((i) => i.id === s.reveal?.id) : undefined
  const endingLine =
    s.reveal?.step === 'ending' ? LINES.find((l) => l.id === s.reveal?.ending) : undefined
  const livesLeft = MAX_STRIKES - s.strikes
  const playing = s.phase === 'away' || s.phase === 'warn' || s.phase === 'look'

  return (
    <div className={`snoop${s.phase === 'caught' ? ' is-caught' : ''}`}>
      <header className="snoop-top">
        <div>
          <a className="snoop-back" href="#/">
            ← 게임 목록
          </a>
          <span className="eyebrow">게임 2</span>
          <h1>영준이의 사생활</h1>
        </div>
        <dl className="snoop-stats">
          <div>
            <dt>도감</dt>
            <dd className="big">
              {s.found.length}
              <small> / {ITEMS.length}</small>
            </dd>
          </div>
          <div>
            <dt>남은 기회</dt>
            <dd aria-label={`${livesLeft}번 남음`}>
              {'❤️'.repeat(livesLeft)}
              {'🖤'.repeat(s.strikes)}
            </dd>
          </div>
          <div>
            <dt>이번 판</dt>
            <dd>{s.roundFound.length}개</dd>
          </div>
        </dl>
      </header>

      <main className="snoop-layout">
        <section aria-label="생활관">
          <div className="snoop-stage">
            {webgl ? (
              <Suspense fallback={<span className="snoop-msg">생활관으로 이동 중…</span>}>
                <SnoopScene
                  phase={s.phase}
                  holding={s.holding}
                  progress={s.progress}
                  onHold={hold}
                />
              </Suspense>
            ) : (
              <span className="snoop-msg">이 브라우저는 3D(WebGL)를 지원하지 않아요.</span>
            )}

            {status && (
              <span className={`snoop-status is-${status.tone}`} aria-live="polite">
                {status.text}
              </span>
            )}
            {bubbleVisible && playing && (
              <span key={bubble.key} className="snoop-bubble">
                {bubble.text}
              </span>
            )}
            {bubbleVisible && s.phase === 'caught' && (
              <span key={bubble.key} className="snoop-bubble is-angry">
                {bubble.text}
              </span>
            )}

            {s.phase === 'ready' && (
              <div className="snoop-card">
                <span className="snoop-card-emoji" aria-hidden="true">
                  🤫
                </span>
                <h2>관물대 수색</h2>
                <p>
                  영준이가 등을 돌린 사이에 관물대 칸을 <b>꾹 눌러서</b> 뒤지세요. 돌아볼 낌새가
                  보이면 바로 손을 떼야 해요. 누르고 있다가 눈이 마주치면 들킵니다. 세 번 들키면
                  끝!
                </p>
                <button
                  type="button"
                  className="snoop-primary"
                  onClick={() => dispatch({ type: 'start', now: Date.now(), r: Math.random() })}
                >
                  몰래 시작하기
                </button>
              </div>
            )}

            {s.phase === 'reveal' && revealItem && !endingLine && (
              <div className="snoop-card">
                {s.reveal?.isNew && <span className="snoop-new">NEW</span>}
                <span className="snoop-card-emoji" aria-hidden="true">
                  {revealItem.emoji}
                </span>
                <span className={`snoop-grade is-${revealItem.grade}`}>
                  {GRADE_NAME[revealItem.grade]}
                </span>
                <h2>{revealItem.name}</h2>
                <p>{revealItem.desc}</p>
                {!s.reveal?.isNew && <p className="snoop-dim">이미 도감에 있는 물건이에요.</p>}
                <button
                  type="button"
                  className="snoop-primary"
                  onClick={() => dispatch({ type: 'next', now: Date.now(), r: Math.random() })}
                >
                  {s.reveal?.ending ? '어...? 자세히 보기' : '제자리에 넣어 두기'}
                </button>
              </div>
            )}

            {s.phase === 'reveal' && endingLine?.ending && (
              <div className="snoop-card is-ending">
                <span className="snoop-new">라인 완성</span>
                <span className="snoop-card-emoji" aria-hidden="true">
                  {endingLine.ending.emoji}
                </span>
                <h2>{endingLine.ending.title}</h2>
                <p>{endingLine.ending.text}</p>
                <button
                  type="button"
                  className="snoop-primary"
                  onClick={() => dispatch({ type: 'next', now: Date.now(), r: Math.random() })}
                >
                  못 본 걸로 하기
                </button>
              </div>
            )}

            {s.phase === 'over' && (
              <div className="snoop-card">
                <span className="snoop-card-emoji" aria-hidden="true">
                  🚨
                </span>
                <h2>세 번 들켰습니다</h2>
                <p>
                  이번 판에 물건 <b>{s.roundFound.length}개</b>를 찾았고, 그중{' '}
                  <b>{s.roundNew}개</b>가 새로운 물건이에요.
                </p>
                {s.roundFound.length > 0 && (
                  <p className="snoop-haul" aria-hidden="true">
                    {s.roundFound.map((id, i) => (
                      <span key={i}>{ITEMS.find((it) => it.id === id)?.emoji}</span>
                    ))}
                  </p>
                )}
                <button
                  type="button"
                  className="snoop-primary"
                  onClick={() => dispatch({ type: 'start', now: Date.now(), r: Math.random() })}
                >
                  다시 몰래 들어가기
                </button>
              </div>
            )}
          </div>

          <div className="snoop-spots">
            {SPOTS.map((spot, i) => (
              <button
                key={spot.id}
                type="button"
                className={`snoop-spot${s.holding === i ? ' is-held' : ''}`}
                disabled={!playing}
                onPointerDown={(e) => {
                  if (e.button === 0) hold(i)
                }}
                onKeyDown={(e) => onSpotKey(e, i, true)}
                onKeyUp={(e) => onSpotKey(e, i, false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <span className="snoop-spot-fill" style={{ width: `${s.progress[i] * 100}%` }} />
                <span className="snoop-spot-name">
                  {i === 2 ? '🔒 ' : ''}
                  {spot.name}
                </span>
                <span className="snoop-spot-meta">
                  {i === 0 ? '흔함 · 빠름' : i === 1 ? '쓸 만함 · 보통' : '귀함 · 느림'}
                </span>
              </button>
            ))}
          </div>
          <p className="snoop-hint">
            칸을 꾹 누르고 있으면 게이지가 차요. 손을 떼도 게이지는 남지만, 들키면 그 칸은 처음부터
            다시예요. 물건을 찾을수록 영준이가 예민해지고, 돌아보는 척만 하기도 해요.
          </p>
        </section>

        <section className="snoop-panel" aria-label="도감">
          {LINES.map((line) => {
            const items = ITEMS.filter((i) => i.line === line.id)
            const got = items.filter((i) => s.found.includes(i.id)).length
            const done = got === items.length
            return (
              <div key={line.id} className="snoop-line">
                <h2>
                  {line.name}
                  <span className="snoop-count">
                    {got} / {items.length}
                  </span>
                </h2>
                <p className="snoop-dim">{line.hint}</p>
                <ul className="snoop-items">
                  {items.map((item) => {
                    const have = s.found.includes(item.id)
                    return (
                      <li key={item.id} className={`snoop-item${have ? '' : ' is-unknown'}`}>
                        <span className="snoop-item-emoji" aria-hidden="true">
                          {have ? item.emoji : '❔'}
                        </span>
                        <span className="snoop-item-body">
                          <span className="snoop-item-name">
                            {have ? item.name : '???'}
                            <span className={`snoop-grade is-${item.grade}`}>
                              {GRADE_NAME[item.grade]}
                            </span>
                          </span>
                          <span className="snoop-item-desc">
                            {have
                              ? item.desc
                              : item.finale
                                ? '이 라인의 나머지를 다 모으면 나타나요.'
                                : '아직 못 찾았어요.'}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {done && line.ending && (
                  <p className="snoop-ending">
                    <b>
                      {line.ending.emoji} {line.ending.title}
                    </b>
                    {line.ending.text}
                  </p>
                )}
              </div>
            )
          })}

          <footer className="snoop-foot">
            <span>지금까지 {s.rounds}판</span>
            <span className="snoop-foot-actions">
              <button type="button" className="snoop-ghost" onClick={() => dispatch({ type: 'toggleMute' })}>
                {s.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}
              </button>
              {confirmWipe ? (
                <>
                  <button
                    type="button"
                    className="snoop-ghost is-danger"
                    onClick={() => {
                      dispatch({ type: 'wipe', now: Date.now() })
                      setConfirmWipe(false)
                    }}
                  >
                    정말 도감 비우기
                  </button>
                  <button type="button" className="snoop-ghost" onClick={() => setConfirmWipe(false)}>
                    취소
                  </button>
                </>
              ) : (
                <button type="button" className="snoop-ghost" onClick={() => setConfirmWipe(true)}>
                  도감 비우기
                </button>
              )}
            </span>
          </footer>
        </section>
      </main>
    </div>
  )
}
