import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { memo, type ReactNode, useEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  Color,
  type Group,
  type Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  type Object3D,
  RepeatWrapping,
  type Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  type Vector3,
} from 'three'
import type { Facing, HitInfo, Mood, Part } from './types'

interface Props {
  mood: Mood
  /** 볼 빨개짐 (0~1) */
  blush?: number
  /** 이마의 딱밤 자국 */
  bump?: boolean
  /** 폭발: 얼굴이 달아오르고 팔을 들고 부들부들 떤다 */
  fever?: boolean
  /** 방금 맞은 한 방. 바뀔 때마다 리액션을 한다. */
  hit?: HitInfo
  /** 매 프레임 불려서 향할 각도를 알려 준다. 참조가 바뀌지 않게 넘길 것. */
  facing: () => Facing
  /** 평소에 머리가 포인터를 따라 볼지 */
  followPointer?: boolean
  /** 넘기면 클릭한 부위를 알려 준다 */
  onHit?: (part: Part, clientX: number, clientY: number, side: number) => void
}

const HEAD_R = 0.8
const HEAD_Y = 0.55
const FEET_Y = -1.72
/** 말풍선 자리를 남기려고 살짝 아래에 세운다 */
const ROOT_Y = -0.08
const SKIN = '#f5cfae'
const SKIN_SHADE = '#e3b28c'
const INK = '#2a2420'
const PI = Math.PI

const noRaycast = () => null

/* ---------- 텍스처 ---------- */

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function makeCamo(repeatX: number, repeatY: number): CanvasTexture {
  const cell = 8
  const n = 12
  const [c, g] = canvas2d(cell * n, cell * n)
  g.fillStyle = '#68784a'
  g.fillRect(0, 0, c.width, c.height)
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const colors = ['#4d5a36', '#2f3524', '#7d6e4c', '#4d5a36', '#7d6e4c']
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(rnd() * n)
    const y = Math.floor(rnd() * n)
    const w = 1 + Math.floor(rnd() * 3)
    const h = 1 + Math.floor(rnd() * 2)
    g.fillStyle = colors[i % colors.length]
    // 가장자리를 넘는 블록은 반대편으로 이어 붙여 이음매를 없앤다
    for (const ox of [0, -n])
      for (const oy of [0, -n])
        g.fillRect((x + ox) * cell, (y + oy) * cell, w * cell, h * cell)
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  t.magFilter = NearestFilter
  t.colorSpace = SRGBColorSpace
  return t
}

function makeNameTag(): CanvasTexture {
  const [c, g] = canvas2d(256, 96)
  g.fillStyle = '#d8cfa8'
  g.fillRect(0, 0, 256, 96)
  g.strokeStyle = '#232a1a'
  g.lineWidth = 8
  g.strokeRect(4, 4, 248, 88)
  g.fillStyle = '#1c1c1c'
  g.font = "700 58px system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('이영준', 128, 52)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** 일병 계급장: 가로줄 두 개 */
function makeRank(): CanvasTexture {
  const [c, g] = canvas2d(96, 80)
  g.fillStyle = '#6f7d52'
  g.fillRect(0, 0, 96, 80)
  g.strokeStyle = '#232a1a'
  g.lineWidth = 6
  g.strokeRect(3, 3, 90, 74)
  g.fillStyle = '#1a1a1a'
  g.fillRect(22, 24, 52, 11)
  g.fillRect(22, 46, 52, 11)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function makeZ(): CanvasTexture {
  const [c, g] = canvas2d(64, 64)
  g.fillStyle = '#5b6cff'
  g.font = '800 54px system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('Z', 32, 34)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function useMaterials() {
  const m = useMemo(() => {
    const toon = (color: string) => new MeshToonMaterial({ color })
    const zMap = makeZ()
    return {
      skin: toon(SKIN),
      skinShade: toon(SKIN_SHADE),
      ink: toon(INK),
      hair: toon('#2b2420'),
      white: new MeshBasicMaterial({ color: '#ffffff' }),
      tongue: toon('#e0606a'),
      bump: toon('#ff6b6b'),
      olive: toon('#4d5a36'),
      boot: toon('#2c2a26'),
      camoBody: new MeshToonMaterial({ map: makeCamo(3, 2) }),
      camoLimb: new MeshToonMaterial({ map: makeCamo(1.5, 1.5) }),
      camoHat: new MeshToonMaterial({ map: makeCamo(4, 1) }),
      camoFlat: new MeshToonMaterial({ map: makeCamo(1, 1) }),
      nameTag: new MeshBasicMaterial({ map: makeNameTag() }),
      rank: new MeshBasicMaterial({ map: makeRank() }),
      sweat: new MeshToonMaterial({ color: '#7cc7ff' }),
      steam: new MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
      shadow: new MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
      zzz: [0, 1, 2].map(
        () => new SpriteMaterial({ map: zMap, transparent: true, depthWrite: false }),
      ),
    }
  }, [])

  useEffect(
    () => () => {
      for (const mat of Object.values(m).flat()) {
        mat.map?.dispose()
        mat.dispose()
      }
    },
    [m],
  )
  return m
}

type Mats = ReturnType<typeof useMaterials>

/* ---------- 얼굴 ---------- */

/** 머리(구) 표면 위에 자식을 올린다. 자식의 +z가 바깥쪽. */
function OnHead({
  yaw,
  pitch,
  r = HEAD_R,
  mirror = false,
  children,
}: {
  yaw: number
  pitch: number
  r?: number
  mirror?: boolean
  children: ReactNode
}) {
  const cp = Math.cos(pitch)
  return (
    <group
      position={[r * Math.sin(yaw) * cp, r * Math.sin(pitch), r * Math.cos(yaw) * cp]}
      rotation={[-pitch, yaw, 0, 'YXZ']}
      scale={[mirror ? -1 : 1, 1, 1]}
    >
      {children}
    </group>
  )
}

/** 한쪽 눈. 화면 왼쪽 눈 기준으로 그리고 오른쪽은 좌우 반전한다. */
function Eye({ mood, m }: { mood: Mood; m: Mats }) {
  switch (mood) {
    case 'surprised':
    case 'shock':
      return (
        <>
          <mesh material={m.ink} scale={[1, 1, 0.22]}>
            <sphereGeometry args={[0.15, 24, 16]} />
          </mesh>
          <mesh material={m.white} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.125, 24, 16]} />
          </mesh>
          <mesh material={m.ink} position={[0, 0, 0.034]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[mood === 'shock' ? 0.032 : 0.052, 16, 12]} />
          </mesh>
        </>
      )
    case 'laugh':
      return (
        <mesh material={m.ink} position={[0, -0.03, 0.012]}>
          <torusGeometry args={[0.09, 0.022, 8, 16, PI]} />
        </mesh>
      )
    case 'sleepy':
      return (
        <mesh material={m.ink} position={[0, 0.03, 0.012]} rotation={[0, 0, PI]}>
          <torusGeometry args={[0.09, 0.02, 8, 16, PI]} />
        </mesh>
      )
    case 'annoyed':
      return (
        <>
          <mesh material={m.ink} position={[0, 0.02, 0.012]} rotation={[0, 0, PI / 2]}>
            <capsuleGeometry args={[0.02, 0.16, 4, 8]} />
          </mesh>
          <mesh material={m.ink} position={[0.015, -0.03, 0.008]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[0.042, 16, 12]} />
          </mesh>
        </>
      )
    case 'hurt':
      return (
        <>
          <mesh material={m.ink} position={[0, 0.035, 0.014]} rotation={[0, 0, PI / 2 - 0.42]}>
            <capsuleGeometry args={[0.022, 0.15, 4, 8]} />
          </mesh>
          <mesh material={m.ink} position={[0, -0.035, 0.014]} rotation={[0, 0, PI / 2 + 0.42]}>
            <capsuleGeometry args={[0.022, 0.15, 4, 8]} />
          </mesh>
        </>
      )
    default: {
      const r = mood === 'angry' ? 0.058 : 0.07
      return (
        <>
          <mesh material={m.ink} scale={[1, 1.1, 0.4]}>
            <sphereGeometry args={[r, 16, 12]} />
          </mesh>
          <mesh material={m.white} position={[0.02, 0.03, r * 0.36]} scale={[1, 1, 0.4]}>
            <sphereGeometry args={[0.02, 8, 8]} />
          </mesh>
        </>
      )
    }
  }
}

/** 눈썹 기울기(양수 = 안쪽이 내려감)와 높이 보정 */
const BROW: Record<Mood, { tilt: number; raise: number; thick: number }> = {
  calm: { tilt: 0.06, raise: 0, thick: 0.022 },
  surprised: { tilt: -0.16, raise: 0.07, thick: 0.022 },
  shock: { tilt: -0.2, raise: 0.09, thick: 0.022 },
  laugh: { tilt: -0.12, raise: 0.03, thick: 0.022 },
  annoyed: { tilt: 0.16, raise: -0.04, thick: 0.024 },
  hurt: { tilt: -0.38, raise: 0, thick: 0.022 },
  angry: { tilt: 0.5, raise: -0.07, thick: 0.03 },
  sleepy: { tilt: -0.06, raise: 0, thick: 0.022 },
}

function Mouth({ mood, m }: { mood: Mood; m: Mats }) {
  switch (mood) {
    case 'surprised':
      return (
        <mesh material={m.ink} scale={[0.85, 1.1, 0.3]}>
          <sphereGeometry args={[0.07, 16, 12]} />
        </mesh>
      )
    case 'shock':
      return (
        <>
          <mesh material={m.ink} scale={[0.9, 1.2, 0.3]}>
            <sphereGeometry args={[0.125, 24, 16]} />
          </mesh>
          <mesh material={m.tongue} position={[0, -0.075, 0.026]} scale={[1.1, 0.7, 0.3]}>
            <sphereGeometry args={[0.065, 16, 12]} />
          </mesh>
        </>
      )
    case 'laugh':
      return (
        <>
          <mesh material={m.ink} scale={[1.15, 0.75, 0.3]}>
            <sphereGeometry args={[0.16, 24, 16]} />
          </mesh>
          <mesh material={m.white} position={[0, 0.065, 0.03]}>
            <boxGeometry args={[0.22, 0.04, 0.03]} />
          </mesh>
          <mesh material={m.tongue} position={[0, -0.055, 0.03]} scale={[1.2, 0.6, 0.3]}>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
        </>
      )
    case 'annoyed':
      return (
        <mesh material={m.ink} position={[0, 0, 0.012]} rotation={[0, 0, PI / 2 + 0.16]}>
          <capsuleGeometry args={[0.02, 0.14, 4, 8]} />
        </mesh>
      )
    case 'hurt':
      return (
        <mesh material={m.ink} position={[0, -0.05, 0.012]} rotation={[0, 0, PI * 0.1]}>
          <torusGeometry args={[0.085, 0.02, 8, 16, PI * 0.8]} />
        </mesh>
      )
    case 'angry':
      return (
        <>
          <mesh material={m.ink} scale={[1.2, 0.68, 0.3]}>
            <sphereGeometry args={[0.15, 24, 16]} />
          </mesh>
          <mesh material={m.white} position={[0, 0.045, 0.034]}>
            <boxGeometry args={[0.24, 0.035, 0.03]} />
          </mesh>
          <mesh material={m.white} position={[0, -0.05, 0.03]}>
            <boxGeometry args={[0.2, 0.03, 0.03]} />
          </mesh>
        </>
      )
    case 'sleepy':
      return (
        <mesh material={m.ink} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.035, 12, 8]} />
        </mesh>
      )
    default:
      return (
        <mesh material={m.ink} position={[0, 0.05, 0.012]} rotation={[0, 0, PI * 1.1]}>
          <torusGeometry args={[0.09, 0.02, 8, 16, PI * 0.8]} />
        </mesh>
      )
  }
}

function Face({ mood, blush, bump, m }: { mood: Mood; blush: number; bump: boolean; m: Mats }) {
  const brow = BROW[mood]
  const cheek = Math.max(blush, mood === 'laugh' ? 0.55 : mood === 'angry' ? 0.6 : 0.3)
  const sweat = mood === 'surprised' || mood === 'annoyed' || mood === 'shock'

  return (
    <>
      {[false, true].map((right) => {
        const s = right ? 1 : -1
        return (
          <group key={s}>
            <OnHead yaw={s * 0.3} pitch={0.04} mirror={right}>
              <Eye mood={mood} m={m} />
            </OnHead>
            <OnHead yaw={s * 0.3} pitch={0.27 + brow.raise} mirror={right}>
              <mesh
                material={m.hair}
                position={[0, 0, 0.012]}
                rotation={[0, 0, PI / 2 - brow.tilt]}
              >
                <capsuleGeometry args={[brow.thick, 0.15, 4, 8]} />
              </mesh>
            </OnHead>
            <OnHead yaw={s * 0.58} pitch={-0.25} r={HEAD_R - 0.004}>
              <mesh scale={[1.25 + blush * 0.4, 0.75 + blush * 0.2, 0.14]}>
                <sphereGeometry args={[0.12, 20, 12]} />
                <meshBasicMaterial color="#ff7f8a" transparent opacity={cheek} depthWrite={false} />
              </mesh>
            </OnHead>
          </group>
        )
      })}

      {/* 코 */}
      <OnHead yaw={0} pitch={-0.14} r={HEAD_R - 0.01}>
        <mesh material={m.skinShade} scale={[1, 0.8, 0.8]}>
          <sphereGeometry args={[0.05, 12, 8]} />
        </mesh>
      </OnHead>

      <OnHead yaw={0} pitch={-0.4}>
        <Mouth mood={mood} m={m} />
      </OnHead>

      {/* 딱밤 자국 */}
      {bump && (
        <OnHead yaw={0} pitch={0.43} r={HEAD_R - 0.02}>
          <mesh material={m.bump} raycast={noRaycast}>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
        </OnHead>
      )}

      {/* 땀 */}
      {sweat && (
        <OnHead yaw={0.82} pitch={0.22} r={HEAD_R + 0.02}>
          <mesh material={m.sweat} scale={[0.8, 1.25, 0.6]} raycast={noRaycast}>
            <sphereGeometry args={[0.07, 12, 8]} />
          </mesh>
        </OnHead>
      )}
    </>
  )
}

/* ---------- 애니메이션 ---------- */

interface Spring {
  x: number
  v: number
}

const spring = (): Spring => ({ x: 0, v: 0 })

function step(s: Spring, dt: number, k: number, c: number) {
  s.v += (-k * s.x - c * s.v) * dt
  s.x += s.v * dt
}

function headRegion(p: Vector3): Part {
  if (p.z < -0.1) return 'back'
  // 귀 바로 옆 머리도 귀로 쳐서 맞히기 쉽게 한다
  if (Math.abs(p.x) > 0.66 && Math.abs(p.y) < 0.25) return 'ear'
  if (p.y > 0.17) return 'forehead'
  const ax = Math.abs(p.x)
  if (ax < 0.11 && p.y < -0.02 && p.y > -0.22) return 'nose'
  if (ax > 0.24 && p.y < 0) return 'cheek'
  return 'face'
}

const SKIN_COLOR = new Color(SKIN)
const RAGE_COLOR = new Color('#f08a72')

/** 3D 이영준 일병. R3F <Canvas> 안에 놓아서 쓴다. */
export const Youngjoon = memo(function Youngjoon({
  mood,
  blush = 0,
  bump = false,
  fever = false,
  hit,
  facing,
  followPointer = true,
  onHit,
}: Props) {
  const m = useMaterials()
  const root = useRef<Group>(null)
  const squashG = useRef<Group>(null)
  const head = useRef<Group>(null)
  const hat = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const shadow = useRef<Mesh>(null)
  const skinMesh = useRef<Mesh>(null)
  const steam = useRef<Group>(null)
  const zzz = useRef<Group>(null)

  const a = useRef({
    squash: spring(),
    kick: spring(),
    lean: spring(),
    hat: spring(),
    stretch: spring(),
    jump: 0,
    jumpV: 0,
    wiggle: 0,
    armsUp: 0,
    rage: 0,
    lookX: 0,
    lookY: 0,
  })

  // 맞았을 때 도구와 부위에 맞는 충격을 준다
  useEffect(() => {
    if (!hit || hit.seq === 0) return
    const s = a.current
    s.squash.v += 5
    s.lean.v += -hit.side * 4
    switch (hit.tool) {
      case 'tickle':
        s.wiggle = 1
        s.armsUp = Math.max(s.armsUp, 0.6)
        break
      case 'pinch':
        s.stretch.v += 9
        break
      case 'flick':
        s.kick.v -= 9
        break
      case 'bugle':
        if (s.jump <= 0.02) s.jumpV = 3.4
        s.armsUp = 1
        break
      default:
        s.kick.v -= 2.5
    }
    if (hit.part === 'hat') s.hat.v += (hit.side >= 0 ? -1 : 1) * 7
    if (hit.part === 'cheek') s.stretch.v += 5
  }, [hit])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = state.clock.elapsedTime
    const s = a.current
    const sleepy = mood === 'sleepy'

    step(s.squash, dt, 220, 14)
    step(s.kick, dt, 160, 12)
    step(s.lean, dt, 120, 10)
    step(s.hat, dt, 90, 7)
    step(s.stretch, dt, 200, 13)
    s.wiggle = Math.max(0, s.wiggle - dt * 2.2)
    s.armsUp = Math.max(0, s.armsUp - dt * 1.6)
    s.rage += ((fever ? 1 : 0) - s.rage) * Math.min(1, dt * 8)

    if (s.jump > 0 || s.jumpV > 0) {
      s.jumpV -= 24 * dt
      s.jump += s.jumpV * dt
      if (s.jump <= 0) {
        s.jump = 0
        s.jumpV = 0
        s.squash.v += 6
      }
    }

    const { yaw, rate } = facing()

    if (root.current) {
      const r = root.current
      r.rotation.y += (yaw - r.rotation.y) * Math.min(1, dt * rate)
      r.rotation.z = s.lean.x * 0.16 + s.wiggle * Math.sin(t * 38) * 0.07
      r.position.x = s.rage * Math.sin(t * 70) * 0.025
      r.position.y = ROOT_Y + s.jump
    }
    if (squashG.current) {
      const q = s.squash.x * 0.09
      const breath = Math.sin(t * 2) * 0.008
      squashG.current.scale.set(1 + q * 0.7, 1 - q + breath, 1 + q * 0.7)
    }
    if (head.current) {
      const h = head.current
      const calm = sleepy || fever || !followPointer ? 0 : 1
      s.lookX += (state.pointer.x * 0.28 * calm - s.lookX) * Math.min(1, dt * 6)
      s.lookY += (-state.pointer.y * 0.14 * calm - s.lookY) * Math.min(1, dt * 6)
      h.rotation.x = s.kick.x * 0.5 + s.lookY + (sleepy ? 0.2 + Math.sin(t * 1.6) * 0.09 : 0)
      h.rotation.y = s.lookX
      h.rotation.z = (sleepy ? 0.1 : 0) + s.wiggle * Math.sin(t * 38 + 1) * 0.1
      h.scale.set(1.04 * (1 + s.stretch.x * 0.13), 0.98 * (1 - s.stretch.x * 0.05), 0.98)
    }
    if (hat.current) {
      hat.current.rotation.z = s.hat.x * 0.45
      hat.current.position.y = Math.abs(s.hat.x) * 0.12
    }
    const up = Math.max(s.armsUp, s.rage)
    const arm = 0.2 + up * 2.3 + (up > 0.05 ? Math.sin(t * 34) * 0.12 * up : 0)
    if (armL.current) armL.current.rotation.z = -arm
    if (armR.current) armR.current.rotation.z = arm
    if (shadow.current) {
      const k = 1 / (1 + s.jump * 0.8)
      shadow.current.scale.set(k, k, 1)
      shadow.current.position.y = FEET_Y + 0.005 - s.jump
    }

    if (skinMesh.current) {
      const skin = skinMesh.current.material as MeshToonMaterial
      skin.color.lerpColors(SKIN_COLOR, RAGE_COLOR, s.rage * 0.75)
    }

    // 분노의 김: 아래에서 위로 반복해서 올라간다
    if (steam.current) {
      steam.current.children.forEach((c, i) => {
        const p = (t * 1.6 + i * 0.37) % 1
        c.position.y = 0.55 + p * 0.55
        c.scale.setScalar(0.6 + p * 0.9)
      })
    }
    if (zzz.current) {
      zzz.current.children.forEach((c, i) => {
        const p = (t * 0.45 + i * 0.33) % 1
        c.position.set(0.75 + p * 0.5, 0.75 + p * 0.9, 0.3)
        c.scale.setScalar(0.16 + p * 0.2)
        ;(c as Sprite).material.opacity = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85
      })
    }
  })

  function onDown(e: ThreeEvent<PointerEvent>) {
    if (!onHit || e.nativeEvent.button !== 0) return
    e.stopPropagation()
    if (!root.current || !head.current) return
    const side = Math.max(-1, Math.min(1, root.current.worldToLocal(e.point.clone()).x / HEAD_R))
    let part: Part = 'body'
    for (let o: Object3D | null = e.object; o; o = o.parent) {
      const p = o.userData.part as Part | 'head' | undefined
      if (!p) continue
      part = p === 'head' ? headRegion(head.current.worldToLocal(e.point.clone())) : p
      break
    }
    onHit(part, e.nativeEvent.clientX, e.nativeEvent.clientY, side)
  }

  const setCursor = (e: ThreeEvent<PointerEvent>, cursor: string) => {
    if (!onHit) return
    ;(e.nativeEvent.target as HTMLElement).style.cursor = cursor
  }

  return (
    <group ref={root} position={[0, ROOT_Y, 0]}>
      {/* 바닥 그림자 */}
      <mesh
        ref={shadow}
        material={m.shadow}
        position={[0, FEET_Y + 0.005, 0]}
        rotation={[-PI / 2, 0, 0]}
        raycast={noRaycast}
      >
        <circleGeometry args={[0.85, 32]} />
      </mesh>

      {/* 발을 기준으로 찌그러진다 */}
      <group ref={squashG} position={[0, FEET_Y, 0]}>
        <group
          position={[0, -FEET_Y, 0]}
          onPointerDown={onDown}
          onPointerOver={(e) => setCursor(e, 'pointer')}
          onPointerOut={(e) => setCursor(e, '')}
        >
          {/* ---- 몸 ---- */}
          <group userData={{ part: 'body' }}>
            {/* 몸통 */}
            <mesh material={m.camoBody} position={[0, -0.76, 0]} scale={[1.12, 0.78, 0.86]}>
              <capsuleGeometry args={[0.46, 0.3, 8, 24]} />
            </mesh>
            {/* 목 */}
            <mesh material={m.skinShade} position={[0, -0.27, 0]}>
              <cylinderGeometry args={[0.17, 0.2, 0.18, 16]} />
            </mesh>
            {/* 깃 */}
            <mesh material={m.camoFlat} position={[-0.17, -0.37, 0.27]} rotation={[-0.5, 0.35, 0.55]}>
              <boxGeometry args={[0.34, 0.15, 0.05]} />
            </mesh>
            <mesh material={m.camoFlat} position={[0.17, -0.37, 0.27]} rotation={[-0.5, -0.35, -0.55]}>
              <boxGeometry args={[0.34, 0.15, 0.05]} />
            </mesh>
            {/* 명찰, 계급장, 주머니 */}
            <mesh material={m.nameTag} position={[-0.25, -0.66, 0.375]} rotation={[0.05, -0.42, 0]}>
              <planeGeometry args={[0.3, 0.11]} />
            </mesh>
            <mesh material={m.rank} position={[0, -0.7, 0.418]} rotation={[0.02, 0, 0]}>
              <planeGeometry args={[0.15, 0.125]} />
            </mesh>
            <mesh material={m.olive} position={[0.26, -0.68, 0.36]} rotation={[0.05, 0.45, 0]}>
              <boxGeometry args={[0.24, 0.16, 0.03]} />
            </mesh>
            {/* 벨트 */}
            <mesh material={m.boot} position={[0, -1.03, 0]} scale={[1, 1, 0.8]}>
              <cylinderGeometry args={[0.475, 0.465, 0.09, 24]} />
            </mesh>

            {/* 팔 (어깨가 회전축) */}
            <group ref={armL} position={[-0.47, -0.5, 0]}>
              <mesh material={m.camoLimb} position={[0, -0.24, 0]}>
                <capsuleGeometry args={[0.135, 0.26, 6, 16]} />
              </mesh>
              <mesh material={m.skin} position={[0, -0.53, 0]}>
                <sphereGeometry args={[0.125, 16, 12]} />
              </mesh>
            </group>
            <group ref={armR} position={[0.47, -0.5, 0]}>
              <mesh material={m.camoLimb} position={[0, -0.24, 0]}>
                <capsuleGeometry args={[0.135, 0.26, 6, 16]} />
              </mesh>
              <mesh material={m.skin} position={[0, -0.53, 0]}>
                <sphereGeometry args={[0.125, 16, 12]} />
              </mesh>
            </group>

            {/* 다리와 전투화 */}
            {[-1, 1].map((sx) => (
              <group key={sx} position={[sx * 0.22, 0, 0]}>
                <mesh material={m.camoLimb} position={[0, -1.3, 0]}>
                  <cylinderGeometry args={[0.2, 0.19, 0.46, 16]} />
                </mesh>
                <mesh material={m.boot} position={[0, -1.6, 0.07]} scale={[1, 0.62, 1.45]}>
                  <sphereGeometry args={[0.21, 16, 12]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* ---- 머리 ---- */}
          <group ref={head} position={[0, HEAD_Y, 0]} userData={{ part: 'head' }}>
            <mesh ref={skinMesh} material={m.skin}>
              <sphereGeometry args={[HEAD_R, 48, 32]} />
            </mesh>
            {/* 짧은 머리: 뒤와 옆만 덮는다 */}
            <mesh material={m.hair}>
              <sphereGeometry args={[HEAD_R + 0.02, 32, 20, PI - 0.18, PI + 0.36, 0, PI * 0.47]} />
            </mesh>
            {/* 귀 */}
            {[-1, 1].map((sx) => (
              <mesh
                key={sx}
                material={m.skinShade}
                position={[sx * 0.84, -0.04, -0.02]}
                scale={[0.5, 1, 0.75]}
                userData={{ part: 'ear' }}
              >
                <sphereGeometry args={[0.18, 16, 12]} />
              </mesh>
            ))}

            <Face mood={mood} blush={blush} bump={bump} m={m} />

            {/* 전투모 */}
            <group position={[0, 0.47, 0]} userData={{ part: 'hat' }}>
              <group ref={hat}>
                <mesh material={m.camoHat} position={[0, 0.26, 0]}>
                  <cylinderGeometry args={[0.67, 0.73, 0.52, 40]} />
                </mesh>
                <mesh material={m.olive} position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.745, 0.745, 0.07, 40]} />
                </mesh>
                {/* 챙 */}
                <mesh material={m.olive} position={[0, 0.0, 0.5]} rotation={[0.22, 0, 0]} scale={[1.5, 1, 1.05]}>
                  <cylinderGeometry args={[0.46, 0.46, 0.06, 32, 1, false, -PI / 2, PI]} />
                </mesh>
                <mesh material={m.rank} position={[0, 0.29, 0.705]} rotation={[-0.115, 0, 0]}>
                  <planeGeometry args={[0.24, 0.2]} />
                </mesh>
              </group>
            </group>

            {/* 분노의 김 */}
            {fever && (
              <group ref={steam}>
                {[-0.95, -0.75, 0.75, 0.95].map((x) => (
                  <mesh key={x} material={m.steam} position={[x, 0.6, 0.1]} raycast={noRaycast}>
                    <sphereGeometry args={[0.1, 12, 8]} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        </group>
      </group>

      {/* 졸음 */}
      {mood === 'sleepy' && (
        <group ref={zzz}>
          {[0, 1, 2].map((i) => (
            <sprite key={i} material={m.zzz[i]} raycast={noRaycast} />
          ))}
        </group>
      )}
    </group>
  )
})
