import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, type Group, MeshBasicMaterial, MeshToonMaterial, SRGBColorSpace } from 'three'
import type { Mood } from '../../../shared/youngjoon/types'
import { Youngjoon } from '../../../shared/youngjoon/Youngjoon'
import { SPOTS } from '../game/items'
import type { Phase } from '../game/useSnoop'

interface Props {
  phase: Phase
  holding: number | null
  progress: number[]
  onHold: (spot: number) => void
}

const PI = Math.PI
/** 영준이와 관물대의 발이 닿는 높이 */
const FLOOR_Y = -1.8

const MOOD: Record<Phase, Mood> = {
  ready: 'calm',
  away: 'calm',
  warn: 'surprised',
  look: 'annoyed',
  caught: 'angry',
  reveal: 'calm',
  over: 'annoyed',
}

/** 단계별로 영준이가 향하는 각도(0 = 이쪽을 봄, PI = 등을 돌림)와 도는 빠르기 */
const FACING: Record<Phase, { yaw: number; rate: number }> = {
  ready: { yaw: 0, rate: 8 },
  away: { yaw: PI, rate: 7 },
  // 낌새: 관물대 쪽으로 살짝 고개를 돌린다
  warn: { yaw: PI - 0.6, rate: 12 },
  look: { yaw: 0, rate: 18 },
  caught: { yaw: 0, rate: 18 },
  reveal: { yaw: PI, rate: 7 },
  over: { yaw: 0, rate: 8 },
}

function makeLabel(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 80
  const g = c.getContext('2d')!
  g.fillStyle = '#f1ecd6'
  g.fillRect(0, 0, 256, 80)
  g.strokeStyle = '#232a1a'
  g.lineWidth = 6
  g.strokeRect(3, 3, 250, 74)
  g.fillStyle = '#1c1c1c'
  g.font = "700 40px system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('일병 이영준', 128, 43)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

const LOCKER_W = 1.0
const LOCKER_H = 2.5
const LOCKER_D = 0.62
const DOOR_W = 0.88
/** 문 세 장의 중심 높이와 키 (관물대 중심 기준, 위에서 아래로) */
const DOORS = [
  { y: 0.78, h: 0.72 },
  { y: 0.0, h: 0.72 },
  { y: -0.82, h: 0.8 },
]

function Locker({ holding, progress, onHold }: Omit<Props, 'phase'>) {
  const hinges = useRef<(Group | null)[]>([])
  const m = useMemo(
    () => ({
      body: new MeshToonMaterial({ color: '#7f8a6c' }),
      door: new MeshToonMaterial({ color: '#99a584' }),
      doorHot: new MeshToonMaterial({ color: '#c3d09f' }),
      inside: new MeshBasicMaterial({ color: '#23271c' }),
      metal: new MeshToonMaterial({ color: '#3a3f33' }),
      lock: new MeshToonMaterial({ color: '#e0b43a' }),
      label: new MeshBasicMaterial({ map: makeLabel() }),
    }),
    [],
  )

  useEffect(
    () => () => {
      for (const mat of Object.values(m)) {
        mat.map?.dispose()
        mat.dispose()
      }
    },
    [m],
  )

  // 문은 수색 게이지만큼 열리고, 뒤지는 동안엔 덜컹거린다
  const live = useRef({ holding, progress })
  useEffect(() => {
    live.current = { holding, progress }
  })
  useFrame((state) => {
    const t = state.clock.elapsedTime
    hinges.current.forEach((h, i) => {
      if (!h) return
      const { holding: held, progress: p } = live.current
      const rattle = held === i ? Math.sin(t * 46) * 0.035 : 0
      const target = -(p[i] * 1.15 + rattle)
      h.rotation.y += (target - h.rotation.y) * 0.35
    })
  })

  const cursor = (e: ThreeEvent<PointerEvent>, value: string) => {
    ;(e.nativeEvent.target as HTMLElement).style.cursor = value
  }

  return (
    <group position={[1.32, FLOOR_Y + LOCKER_H / 2, 0]}>
      <mesh material={m.body}>
        <boxGeometry args={[LOCKER_W, LOCKER_H, LOCKER_D]} />
      </mesh>
      {/* 받침 */}
      <mesh material={m.metal} position={[0, -LOCKER_H / 2 + 0.04, 0]}>
        <boxGeometry args={[LOCKER_W + 0.04, 0.08, LOCKER_D + 0.04]} />
      </mesh>

      {DOORS.map((d, i) => (
        <group key={SPOTS[i].id} position={[0, d.y + 0.08, LOCKER_D / 2]}>
          {/* 문이 열리면 보이는 어두운 속 */}
          <mesh material={m.inside} position={[0, 0, 0.002]}>
            <planeGeometry args={[DOOR_W - 0.04, d.h - 0.04]} />
          </mesh>
          {/* 경첩은 왼쪽 */}
          <group
            ref={(el) => {
              hinges.current[i] = el
            }}
            position={[-DOOR_W / 2, 0, 0.012]}
          >
            <group
              position={[DOOR_W / 2, 0, 0]}
              onPointerDown={(e) => {
                if (e.nativeEvent.button !== 0) return
                e.stopPropagation()
                onHold(i)
              }}
              onPointerOver={(e) => cursor(e, 'pointer')}
              onPointerOut={(e) => cursor(e, '')}
            >
              <mesh material={holding === i ? m.doorHot : m.door} position={[0, 0, 0.015]}>
                <boxGeometry args={[DOOR_W, d.h, 0.03]} />
              </mesh>
              {/* 손잡이 */}
              <mesh material={m.metal} position={[DOOR_W / 2 - 0.1, 0, 0.05]}>
                <boxGeometry args={[0.05, 0.2, 0.04]} />
              </mesh>
              {/* 통풍구 */}
              {[0.12, 0.06, 0].map((dy) => (
                <mesh key={dy} material={m.metal} position={[-0.08, d.h / 2 - 0.12 - dy, 0.032]}>
                  <boxGeometry args={[0.36, 0.02, 0.006]} />
                </mesh>
              ))}
              {i === 0 && (
                <mesh material={m.label} position={[-0.08, -0.1, 0.032]}>
                  <planeGeometry args={[0.46, 0.145]} />
                </mesh>
              )}
              {/* 아랫칸 자물쇠 */}
              {i === 2 && (
                <group position={[DOOR_W / 2 - 0.1, -0.2, 0.05]}>
                  <mesh material={m.lock}>
                    <boxGeometry args={[0.13, 0.11, 0.05]} />
                  </mesh>
                  <mesh material={m.metal} position={[0, 0.055, 0]}>
                    <torusGeometry args={[0.04, 0.012, 8, 16, PI]} />
                  </mesh>
                </group>
              )}
            </group>
          </group>
        </group>
      ))}
    </group>
  )
}

/** 화면이 좁으면 장면 전체를 줄여서 둘 다 보이게 한다 */
function Fit({ children }: { children: ReactNode }) {
  const aspect = useThree((s) => s.viewport.aspect)
  const k = Math.min(1, aspect / 1.2)
  return (
    <group scale={k} position={[-0.12 * k, FLOOR_Y * (1 - k) * 0.9, 0]}>
      {children}
    </group>
  )
}

export default function SnoopScene({ phase, holding, progress, onHold }: Props) {
  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  })
  const facing = useCallback(() => FACING[phaseRef.current], [])

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
      <Fit>
        <group position={[-0.72, 0, 0]}>
          <Youngjoon
            mood={MOOD[phase]}
            fever={phase === 'caught'}
            facing={facing}
            followPointer={false}
          />
        </group>
        <Locker holding={holding} progress={progress} onHold={onHold} />
      </Fit>
    </Canvas>
  )
}
