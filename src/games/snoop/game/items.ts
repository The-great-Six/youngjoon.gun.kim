export type Grade = 'common' | 'normal' | 'rare' | 'legend'

export const GRADE_NAME: Record<Grade, string> = {
  common: '흔함',
  normal: '보통',
  rare: '희귀',
  legend: '전설',
}

export type LineId = 'daily' | 'crush' | 'love'

export interface Line {
  id: LineId
  name: string
  hint: string
  /** 라인을 완성하면 열리는 반전 엔딩 */
  ending?: { title: string; emoji: string; text: string }
}

export const LINES: Line[] = [
  {
    id: 'daily',
    name: '일상',
    hint: '군인이라면 누구나 하나쯤 숨겨 둔 것들',
  },
  {
    id: 'crush',
    name: '짝사랑 증거',
    hint: '영준이가 요즘 자꾸 멍하니 있는 이유',
    ending: {
      title: '짝사랑의 정체',
      emoji: '🍗',
      text: '꼬깃꼬깃한 사진을 뒤집어 보니 치킨이었다. 편지의 "그대"도, 고백 멘트 14안도, 근무표의 하트도 전부 치킨을 향한 것이었다. 하트가 붙은 요일은 급식에 치킨이 나오는 날이었다.',
    },
  },
  {
    id: 'love',
    name: '비밀 연애',
    hint: '매일 밤 같은 시간에 사라지는 영준이',
    ending: {
      title: '비밀 연애의 정체',
      emoji: '👩',
      text: '통화 기록 메모에는 한 사람만 적혀 있었다. "엄마". 100일 기념 계획표는 입대 100일 기념 효도 계획이었고, 예산이 유난히 컸던 건 안마의자 때문이었다. 선물 리본은 세 번 다시 묶은 것이었다.',
    },
  },
]

export interface Item {
  id: string
  line: LineId
  name: string
  emoji: string
  grade: Grade
  desc: string
  /** 같은 라인의 나머지를 다 모아야 나오는 마지막 물건 */
  finale?: boolean
}

/** 모든 물건은 지어낸 설정이다. 실제 인물의 정보는 넣지 않는다. */
export const ITEMS: Item[] = [
  // 일상
  { id: 'chocopie', line: 'daily', name: '반쯤 먹은 초코파이', emoji: '🍫', grade: 'common', desc: '양말 속에 숨겨 둠. 누가 봐도 숨긴 티가 난다.' },
  { id: 'calc', line: 'daily', name: '전역일 계산기', emoji: '🧮', grade: 'common', desc: '하루에 열두 번 두드린다. 숫자는 어제와 하루 차이.' },
  { id: 'receipt', line: 'daily', name: 'PX 영수증 뭉치', emoji: '🧾', grade: 'common', desc: '월급의 행방이 여기 다 적혀 있다.' },
  { id: 'sock', line: 'daily', name: '양말 한 짝', emoji: '🧦', grade: 'common', desc: '나머지 한 짝의 행방은 아무도 모른다. 본인도 모른다.' },
  { id: 'ramen', line: 'daily', name: '숨겨 둔 컵라면', emoji: '🍜', grade: 'common', desc: '유통기한이 전역일보다 길다. 그때까지 아낄 생각인 듯.' },
  { id: 'star', line: 'daily', name: '별사탕 모음', emoji: '⭐', grade: 'normal', desc: '건빵은 다 먹고 별사탕만 골라 모아 뒀다. 37개.' },
  { id: 'workout', line: 'daily', name: '운동 계획표', emoji: '📋', grade: 'normal', desc: '1일 차만 체크되어 있다.' },
  { id: 'leave', line: 'daily', name: '휴가 계획 노트', emoji: '📒', grade: 'normal', desc: '3박 4일이 분 단위로 짜여 있다. 첫 줄은 "치킨".' },
  { id: 'lotto', line: 'daily', name: '지난주 로또', emoji: '🎟️', grade: 'normal', desc: '5등도 안 됐다. 그래도 버리지 못했다.' },
  { id: 'diary', line: 'daily', name: '오글거리는 일기장', emoji: '📔', grade: 'rare', desc: '"오늘도 나는 버티었다." 매일 같은 문장으로 끝난다.' },
  { id: 'mirror', line: 'daily', name: '거울 앞 연습 메모', emoji: '🪞', grade: 'rare', desc: '"전역을 명 받았습니다"를 벌써 연습 중이다.' },
  { id: 'sergeant', line: 'daily', name: '병장 계급장', emoji: '🎖️', grade: 'legend', desc: '아직 일병인데 미리 사 뒀다.' },

  // 짝사랑 증거
  { id: 'roster', line: 'crush', name: '하트가 그려진 근무표', emoji: '🗓️', grade: 'normal', desc: '특정 요일에만 하트가 붙어 있다. 이유는 적혀 있지 않다.' },
  { id: 'letter', line: 'crush', name: '부치지 못한 편지', emoji: '💌', grade: 'rare', desc: '"그대에게"로 시작해서 세 줄 쓰고 끝났다. 지운 자국이 더 많다.' },
  { id: 'confess', line: 'crush', name: '고백 멘트 연습장', emoji: '📝', grade: 'rare', desc: '1안부터 14안까지 있다. 전부 줄이 그어져 있다.' },
  { id: 'photo', line: 'crush', name: '꼬깃꼬깃한 사진 한 장', emoji: '🖼️', grade: 'legend', desc: '뒤집어 보니... 치킨 사진이다.', finale: true },

  // 비밀 연애
  { id: 'phonecard', line: 'love', name: '닳도록 쓴 전화카드', emoji: '☎️', grade: 'normal', desc: '매일 밤 같은 시간에 공중전화로 사라진다.' },
  { id: 'plan100', line: 'love', name: '100일 기념 계획표', emoji: '📅', grade: 'rare', desc: '날짜가 다음 휴가와 정확히 겹친다. 예산 항목이 유난히 크다.' },
  { id: 'gift', line: 'love', name: '정성스럽게 포장된 선물', emoji: '🎁', grade: 'rare', desc: '리본까지 매여 있다. 누구 것인지는 적혀 있지 않다.' },
  { id: 'calllog', line: 'love', name: '통화 기록 메모', emoji: '📞', grade: 'legend', desc: '매일 밤 통화 상대는... 엄마였다.', finale: true },
]

export interface Spot {
  id: 'top' | 'mid' | 'low'
  name: string
  /** 게이지를 다 채우는 데 걸리는 시간(초) */
  seconds: number
  /** 등급별 뽑기 가중치 */
  weights: Record<Grade, number>
  /** 라인별 가중치 배수 */
  lines: Record<LineId, number>
}

/** 관물대의 세 칸. 아래로 갈수록 귀한 게 나오지만 오래 걸린다. */
export const SPOTS: Spot[] = [
  {
    id: 'top',
    name: '윗칸',
    seconds: 2.2,
    weights: { common: 10, normal: 4, rare: 0.6, legend: 0 },
    lines: { daily: 1, crush: 0.6, love: 0.3 },
  },
  {
    id: 'mid',
    name: '가운데 칸',
    seconds: 3.6,
    weights: { common: 2, normal: 6, rare: 4, legend: 0.5 },
    lines: { daily: 1, crush: 1.6, love: 0.8 },
  },
  {
    id: 'low',
    name: '아랫칸',
    seconds: 5.4,
    weights: { common: 0, normal: 2, rare: 6, legend: 2.5 },
    lines: { daily: 0.8, crush: 1, love: 1.8 },
  },
]

/** 아직 못 본 물건이 더 잘 나오게 하는 배수 */
const NEW_BONUS = 4

/** r(0~1)로 그 칸에서 나올 물건을 고른다. */
export function drawItem(spot: Spot, found: string[], r: number): Item {
  const have = new Set(found)
  const pool = ITEMS.map((item) => {
    // 라인의 마지막 물건은 나머지를 다 모아야 나온다
    if (item.finale) {
      const rest = ITEMS.filter((o) => o.line === item.line && !o.finale)
      if (!rest.every((o) => have.has(o.id))) return { item, w: 0 }
    }
    const w =
      spot.weights[item.grade] *
      spot.lines[item.line] *
      (have.has(item.id) ? 1 : NEW_BONUS) *
      (item.finale ? 3 : 1)
    return { item, w }
  })
  const total = pool.reduce((sum, p) => sum + p.w, 0)
  let at = r * total
  for (const p of pool) {
    at -= p.w
    if (p.w > 0 && at <= 0) return p.item
  }
  return pool.filter((p) => p.w > 0).at(-1)?.item ?? ITEMS[0]
}

export const LINES_AWAY = [
  '흥얼흥얼~',
  '전역까지 며칠이더라...',
  '오늘 저녁 메뉴가 뭐였지',
  '휴가 나가면 뭐 먹지...',
  '(전투화를 닦는 중)',
]

export const LINES_WARN = ['응?', '무슨 소리지?', '...?', '누가 있나?']

export const LINES_CLEAR = ['...기분 탓인가', '쥐인가?', '바람 소리였나']

export const LINES_CAUGHT = [
  '지금 뭐 하시는 겁니까?!',
  '제 관물대입니다!!',
  '사생활 보호해 주십시오!!',
  '거긴 열면 안 됩니다!!',
]

export const pick = <T,>(list: T[], r = Math.random()): T =>
  list[Math.min(list.length - 1, Math.floor(r * list.length))]
