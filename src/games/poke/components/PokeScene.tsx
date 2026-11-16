import { Canvas } from '@react-three/fiber'
import { type RefObject, useCallback } from 'react'
import type { HitInfo, Mood, Part } from '../../../shared/youngjoon/types'
import { Youngjoon } from '../../../shared/youngjoon/Youngjoon'
import { frontOf, isResting, type ViewState } from '../game/view'

interface Props {
  mood: Mood
  blush: number
  bump: boolean
  fever: boolean
  hit: HitInfo
  view: RefObject<ViewState>
  onHit: (part: Part, clientX: number, clientY: number, side: number) => void
}

export default function PokeScene({ view, ...rest }: Props) {
  // 드래그한 각도를 따라가다가, 손을 떼고 잠시 지나면 천천히 정면으로 돌아온다
  const facing = useCallback(() => {
    const v = view.current
    return isResting(v) ? { yaw: frontOf(v.yaw), rate: 3 } : { yaw: v.yaw, rate: 14 }
  }, [view])

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0.45, 7.6], fov: 31 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
    >
      <hemisphereLight args={['#ffffff', '#c9c2a8', 2.1]} />
      <directionalLight position={[2.5, 4, 5]} intensity={1.7} />
      <Youngjoon {...rest} facing={facing} />
    </Canvas>
  )
}
