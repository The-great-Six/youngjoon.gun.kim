export type Mood =
  | 'calm'
  | 'surprised'
  | 'laugh'
  | 'annoyed'
  | 'hurt'
  | 'shock'
  | 'angry'
  | 'sleepy'

export type ToolId = 'poke' | 'tickle' | 'pinch' | 'flick' | 'bugle'

/** 3D 모델에서 클릭된 부위 */
export type Part =
  | 'hat'
  | 'forehead'
  | 'cheek'
  | 'nose'
  | 'ear'
  | 'face'
  | 'back'
  | 'body'

export const PART_NAME: Record<Part, string> = {
  hat: '모자',
  forehead: '이마',
  cheek: '볼',
  nose: '코',
  ear: '귀',
  face: '얼굴',
  back: '뒤통수',
  body: '옆구리',
}

/** 급소를 맞혔을 때 포인트 배수 */
export const WEAK_MULT = 2

/** 도구와 상관없이 부위 때문에 나오는 대사 */
export const PART_LINES: Partial<Record<Part, string[]>> = {
  hat: ['모자 삐뚤어집니다!', '전투모는 건드리지 마십시오', '각 잡아 놓은 겁니다!'],
  nose: ['코는 누르지 마십시오', '돼지코 됩니다!'],
  ear: ['귀는 예민합니다!', '귀 빨개집니다'],
  back: ['뒤에서 그러시면 반칙입니다', '누, 누구십니까?!'],
  body: ['옆구리는 반칙입니다', '거긴 간지럽습니다!'],
}

export interface Tool {
  id: ToolId
  name: string
  emoji: string
  power: number
  cost: number
  mood: Mood
  /** 짜증 게이지 상승량 */
  annoy: number
  /** 이 부위를 맞히면 포인트가 WEAK_MULT배 */
  weak: Part
  lines: string[]
}

export const TOOLS: Tool[] = [
  {
    id: 'poke',
    name: '콕 찌르기',
    emoji: '👉',
    power: 1,
    cost: 0,
    mood: 'surprised',
    annoy: 5,
    weak: 'body',
    lines: [
      '네? 부르셨습니까?',
      '아 깜짝이야!',
      '왜... 왜 그러십니까',
      '일병 이영준! ...아무도 없네?',
      '콕 하지 마십시오',
      '손가락이 매섭습니다',
    ],
  },
  {
    id: 'tickle',
    name: '간지럽히기',
    emoji: '🪶',
    power: 4,
    cost: 60,
    mood: 'laugh',
    annoy: 6,
    weak: 'nose',
    lines: [
      '흐헤헤헿 하지 마십시오!',
      '크흡... 안 웃었습니다!',
      '간지럽습니다아아',
      '으하하 그만! 그만!',
      '웃으면 지는 겁니다... 크흡',
      '에... 에취!',
    ],
  },
  {
    id: 'pinch',
    name: '볼 꼬집기',
    emoji: '🤏',
    power: 12,
    cost: 400,
    mood: 'annoyed',
    annoy: 7,
    weak: 'cheek',
    lines: [
      '볼 늘어납니다!',
      '아야야야',
      '제 볼은 공용이 아닙니다!',
      '볼살 압수입니까...',
      '말랑하다고 막 만지시면 안 됩니다',
    ],
  },
  {
    id: 'flick',
    name: '딱밤',
    emoji: '🫰',
    power: 35,
    cost: 2500,
    mood: 'hurt',
    annoy: 9,
    weak: 'forehead',
    lines: [
      '악! 이마에 불났습니다!',
      '딱밤은 반칙입니다!!',
      '별이 보입니다...',
      '이마가 남아나질 않습니다',
    ],
  },
  {
    id: 'bugle',
    name: '기상나팔',
    emoji: '📯',
    power: 120,
    cost: 15000,
    mood: 'shock',
    annoy: 12,
    weak: 'ear',
    lines: [
      '기, 기상!! ...아직 밤입니까?',
      '귀가 멍합니다!!',
      '점호입니까?!',
      '심장 떨어질 뻔했습니다',
    ],
  },
]

export type AutoId = 'mosquito' | 'alarm' | 'kakao' | 'laces' | 'roach'

export interface Auto {
  id: AutoId
  name: string
  emoji: string
  desc: string
  /** 초당 포인트 */
  rate: number
  baseCost: number
}

export const AUTOS: Auto[] = [
  {
    id: 'mosquito',
    name: '모기 한 마리',
    emoji: '🦟',
    desc: '불 끄면 귓가에서 앵앵',
    rate: 0.5,
    baseCost: 25,
  },
  {
    id: 'alarm',
    name: '5분 뒤 알람',
    emoji: '⏰',
    desc: '취침 직전 몰래 맞춰 둔 알람',
    rate: 3,
    baseCost: 250,
  },
  {
    id: 'kakao',
    name: '카톡 폭탄',
    emoji: '📱',
    desc: '"영준아" "영준아" "영준아"',
    rate: 15,
    baseCost: 2000,
  },
  {
    id: 'laces',
    name: '전투화 끈 묶어 두기',
    emoji: '🥾',
    desc: '양쪽 끈을 서로 묶어 놓기',
    rate: 60,
    baseCost: 12000,
  },
  {
    id: 'roach',
    name: '관물대 고무 바퀴벌레',
    emoji: '🪳',
    desc: '열 때마다 비명 확정',
    rate: 250,
    baseCost: 70000,
  },
]

export const AUTO_COST_GROWTH = 1.15

export function autoCost(auto: Auto, owned: number): number {
  return Math.ceil(auto.baseCost * AUTO_COST_GROWTH ** owned)
}

export const RAGE_LINES = [
  '아 진짜 그만 좀 하십시오!!!',
  '참을 인 세 번 끝났습니다!!',
  '일병도 화낼 줄 압니다!!',
  '휴가 나가면 다 이를 겁니다!!',
]

export const IDLE_LINES = [
  '휴가 언제 나가지...',
  'PX 가고 싶다...',
  '...끝난 겁니까?',
  '평화롭다...',
  '전역까지 며칠이더라...',
]

/** 누적 포인트에 따른 플레이어 칭호 */
export const RANKS: { min: number; title: string }[] = [
  { min: 0, title: '장난 이병' },
  { min: 500, title: '장난 일병' },
  { min: 5000, title: '장난 상병' },
  { min: 50000, title: '장난 병장' },
  { min: 500000, title: '장난 전설' },
]

export function rankFor(total: number): string {
  let title = RANKS[0].title
  for (const r of RANKS) if (total >= r.min) title = r.title
  return title
}

export const RAGE_MAX = 100
export const RAGE_DECAY_PER_SEC = 10
export const FEVER_MS = 6000
export const FEVER_MULT = 3
export const IDLE_MS = 6000

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function fmt(n: number): string {
  const v = Math.floor(n)
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${(v / 10_000).toFixed(v >= 1_000_000 ? 0 : 1)}만`
  return v.toLocaleString('ko-KR')
}
