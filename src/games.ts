import { type ComponentType, lazy, type LazyExoticComponent } from 'react'

export interface GameEntry {
  /** 주소에 쓰는 이름: #/<slug> */
  slug: string
  number: number
  title: string
  desc: string
  emoji: string
  /** 아직 못 하는 게임은 비워 둔다 */
  component?: LazyExoticComponent<ComponentType>
}

/** 홈 화면에 나오는 게임 목록. 새 게임은 여기에 한 줄 추가하면 된다. */
export const GAMES: GameEntry[] = [
  {
    slug: 'game1',
    number: 1,
    title: '이영준 일병 괴롭히기',
    desc: '3D 이영준 일병을 콕 찌르고, 볼을 꼬집고, 귀에 기상나팔을 불어 주는 클리커 게임.',
    emoji: '👉',
    component: lazy(() => import('./games/poke/PokeGame')),
  },
  {
    slug: 'game2',
    number: 2,
    title: '영준이의 사생활',
    desc: '영준이가 등을 돌린 사이에 벌어지는 일. 지금 기획하고 있어요.',
    emoji: '🤫',
  },
]
