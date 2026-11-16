import { Suspense, useEffect, useSyncExternalStore } from 'react'
import { GAMES } from './games'
import Home from './pages/Home'

const SITE_TITLE = '이영준 일병 게임 모음'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** 주소의 # 뒤를 읽는다. 정적 호스팅에서도 새로고침이 깨지지 않게 해시를 쓴다. */
function useRoute(): string {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return hash.replace(/^#\/?/, '')
}

export default function App() {
  const route = useRoute()
  const game = GAMES.find((g) => g.slug === route && g.component)

  useEffect(() => {
    document.title = game ? `${game.title} · ${SITE_TITLE}` : SITE_TITLE
    window.scrollTo(0, 0)
  }, [game])

  if (!game?.component) return <Home />

  const Game = game.component
  return (
    <Suspense fallback={<p className="loading">불러오는 중…</p>}>
      <Game />
    </Suspense>
  )
}
