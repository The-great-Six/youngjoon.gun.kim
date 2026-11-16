import { GAMES } from '../games'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <header className="home-top">
        <span className="eyebrow">제1장난대대</span>
        <h1>이영준 일병 게임 모음</h1>
        <p className="home-lead">이영준 일병과 함께하는 게임들. 하나 골라서 시작하세요.</p>
      </header>

      <ul className="home-list">
        {GAMES.map((g) => {
          const body = (
            <>
              <span className="card-art" aria-hidden="true">
                {g.emoji}
              </span>
              <span className="card-body">
                <span className="card-title">
                  게임 {g.number}: {g.title}
                </span>
                <span className="card-desc">{g.desc}</span>
              </span>
              <span className="card-cta">{g.component ? '하러 가기 →' : '준비 중'}</span>
            </>
          )
          return (
            <li key={g.slug}>
              {g.component ? (
                <a className="card" href={`#/${g.slug}`}>
                  {body}
                </a>
              ) : (
                <div className="card is-soon" aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
