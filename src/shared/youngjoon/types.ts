export type Mood =
  | 'calm'
  | 'surprised'
  | 'laugh'
  | 'annoyed'
  | 'hurt'
  | 'shock'
  | 'angry'
  | 'sleepy'

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

/** 맞았을 때의 몸짓 종류 */
export type Reaction = 'poke' | 'tickle' | 'pinch' | 'flick' | 'bugle'

/** 방금 들어간 한 방. 모델이 이걸 보고 리액션을 한다. */
export interface HitInfo {
  seq: number
  tool: Reaction
  part: Part
  /** 맞은 위치의 좌우 (-1 ~ 1) */
  side: number
}

/** 매 프레임 모델이 향할 각도와, 거기까지 따라가는 빠르기 */
export interface Facing {
  yaw: number
  rate: number
}
