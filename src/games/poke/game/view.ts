import type { Part, ToolId } from './data'

/** 드래그 회전 상태. 무대(App)가 쓰고 3D 장면은 읽기만 한다. */
export interface ViewState {
  yaw: number
  dragging: boolean
  lastDragAt: number
}

/** 방금 들어간 한 방. 3D 장면이 이걸 보고 리액션을 한다. */
export interface HitInfo {
  seq: number
  tool: ToolId
  part: Part
  /** 맞은 위치의 좌우 (-1 ~ 1) */
  side: number
}

/** 이만큼 손을 떼고 있으면 정면으로 돌아온다 */
export const VIEW_REST_MS = 2500

/** 주어진 각도에서 가장 가까운 정면 각도 */
export const frontOf = (yaw: number) =>
  Math.round(yaw / (Math.PI * 2)) * Math.PI * 2

export const isResting = (v: ViewState) =>
  !v.dragging && performance.now() - v.lastDragAt > VIEW_REST_MS
