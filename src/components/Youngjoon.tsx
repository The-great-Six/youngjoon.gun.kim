import type { Mood } from '../game/data'

interface Props {
  mood: Mood
  /** 볼 꼬집힘 정도 (0~1) */
  blush: number
  /** 딱밤 자국 */
  bump: boolean
}

const SKIN = '#f5cfae'
const SKIN_SHADE = '#e3b28c'
const INK = '#2a2420'

/** 디지털 위장 무늬 */
function CamoPattern({ id, scale = 1 }: { id: string; scale?: number }) {
  const s = 6 * scale
  const cells: [number, number, string][] = [
    [0, 0, '#4d5a36'],
    [1, 0, '#4d5a36'],
    [3, 0, '#7d6e4c'],
    [4, 1, '#7d6e4c'],
    [5, 1, '#7d6e4c'],
    [0, 2, '#2f3524'],
    [1, 3, '#2f3524'],
    [2, 3, '#4d5a36'],
    [4, 3, '#2f3524'],
    [5, 4, '#4d5a36'],
    [2, 5, '#7d6e4c'],
    [3, 5, '#7d6e4c'],
    [0, 5, '#4d5a36'],
    [5, 5, '#2f3524'],
  ]
  return (
    <pattern
      id={id}
      width={s * 6}
      height={s * 6}
      patternUnits="userSpaceOnUse"
    >
      <rect width={s * 6} height={s * 6} fill="#68784a" />
      {cells.map(([x, y, c]) => (
        <rect
          key={`${x}-${y}`}
          x={x * s}
          y={y * s}
          width={s}
          height={s}
          fill={c}
        />
      ))}
    </pattern>
  )
}

function RankBars({ x, y, w }: { x: number; y: number; w: number }) {
  // 일병: 가로줄 두 개
  return (
    <g fill="#1a1a1a">
      <rect x={x} y={y} width={w} height={3.2} rx={1} />
      <rect x={x} y={y + 6} width={w} height={3.2} rx={1} />
    </g>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  const stroke = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' }
  switch (mood) {
    case 'surprised':
    case 'shock': {
      const pupil = mood === 'shock' ? 2.2 : 3.8
      return (
        <g>
          {[98, 142].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={142} r={10} fill="#fff" stroke={INK} strokeWidth={2.5} />
              <circle cx={cx} cy={143} r={pupil} fill={INK} />
            </g>
          ))}
        </g>
      )
    }
    case 'laugh':
      return (
        <g {...stroke}>
          <path d="M89 146 Q98 134 107 146" />
          <path d="M133 146 Q142 134 151 146" />
        </g>
      )
    case 'annoyed':
      return (
        <g>
          <g {...stroke}>
            <path d="M88 140 L108 140" />
            <path d="M132 140 L152 140" />
          </g>
          <circle cx={100} cy={145} r={3.6} fill={INK} />
          <circle cx={144} cy={145} r={3.6} fill={INK} />
        </g>
      )
    case 'hurt':
      return (
        <g {...stroke}>
          <path d="M91 135 L105 142 L91 149" />
          <path d="M149 135 L135 142 L149 149" />
        </g>
      )
    case 'sleepy':
      return (
        <g {...stroke}>
          <path d="M89 142 Q98 148 107 142" />
          <path d="M133 142 Q142 148 151 142" />
        </g>
      )
    default:
      return (
        <g>
          {[98, 142].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={142} r={mood === 'angry' ? 4.5 : 5.5} fill={INK} />
              <circle cx={cx + 1.8} cy={140} r={1.6} fill="#fff" />
            </g>
          ))}
        </g>
      )
  }
}

function Brows({ mood }: { mood: Mood }) {
  const p = { stroke: '#3a2a1e', strokeWidth: 4.5, strokeLinecap: 'round' as const, fill: 'none' }
  switch (mood) {
    case 'surprised':
    case 'shock':
      return (
        <g {...p}>
          <path d="M87 120 Q98 113 109 119" />
          <path d="M131 119 Q142 113 153 120" />
        </g>
      )
    case 'annoyed':
      return (
        <g {...p}>
          <path d="M87 126 L109 129" />
          <path d="M153 126 L131 129" />
        </g>
      )
    case 'angry':
      return (
        <g {...p} strokeWidth={5.5}>
          <path d="M85 121 L110 132" />
          <path d="M155 121 L130 132" />
        </g>
      )
    case 'hurt':
      return (
        <g {...p}>
          <path d="M87 130 L108 123" />
          <path d="M153 130 L132 123" />
        </g>
      )
    case 'laugh':
      return (
        <g {...p}>
          <path d="M87 124 Q98 117 109 123" />
          <path d="M131 123 Q142 117 153 124" />
        </g>
      )
    default:
      return (
        <g {...p}>
          <path d="M87 127 Q98 122 109 126" />
          <path d="M131 126 Q142 122 153 127" />
        </g>
      )
  }
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'surprised':
      return <ellipse cx={120} cy={178} rx={6} ry={8} fill={INK} />
    case 'shock':
      return (
        <g>
          <ellipse cx={120} cy={180} rx={11} ry={14} fill={INK} />
          <ellipse cx={120} cy={188} rx={7} ry={4.5} fill="#e0606a" />
        </g>
      )
    case 'laugh':
      return (
        <g>
          <path d="M100 169 Q120 200 140 169 Z" fill={INK} />
          <path d="M108 184 Q120 194 132 184 Q120 178 108 184 Z" fill="#e0606a" />
          <path d="M103 170 L137 170 L135 175 L105 175 Z" fill="#fff" />
        </g>
      )
    case 'annoyed':
      return (
        <path
          d="M107 179 Q113 174 120 179 Q127 184 133 179"
          stroke={INK}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      )
    case 'hurt':
      return (
        <path
          d="M105 181 Q112 172 120 180 Q128 172 135 181"
          stroke={INK}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      )
    case 'angry':
      return (
        <g>
          <rect x={101} y={167} width={38} height={22} rx={7} fill={INK} />
          <rect x={104} y={169} width={32} height={5} rx={2} fill="#fff" />
          <rect x={106} y={183} width={28} height={4} rx={2} fill="#fff" />
        </g>
      )
    case 'sleepy':
      return <circle cx={122} cy={179} r={3.5} fill={INK} />
    default:
      return (
        <path
          d="M109 174 Q120 184 131 174"
          stroke={INK}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      )
  }
}

export function Youngjoon({ mood, blush, bump }: Props) {
  const sweat = mood === 'surprised' || mood === 'annoyed' || mood === 'shock'
  const cheek = Math.max(blush, mood === 'laugh' ? 0.55 : mood === 'angry' ? 0.6 : 0.25)
  const cheekR = 11 + blush * 6

  return (
    <svg
      viewBox="0 0 240 300"
      className="yj-svg"
      role="img"
      aria-label={`이영준 일병 (${mood})`}
    >
      <defs>
        <CamoPattern id="camo" />
        <CamoPattern id="camo-sm" scale={0.6} />
        <radialGradient id="rage" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ff3b30" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ff3b30" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* 몸통 (전투복) */}
      <path
        d="M36 300 L44 238 Q50 206 92 198 L148 198 Q190 206 196 238 L204 300 Z"
        fill="url(#camo)"
        stroke="#232a1a"
        strokeWidth={3}
      />
      <g stroke="#232a1a" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.7}>
        <path d="M70 244 L64 300" />
        <path d="M170 244 L176 300" />
      </g>

      {/* 목 */}
      <rect x={104} y={182} width={32} height={26} rx={6} fill={SKIN_SHADE} />

      {/* 깃 */}
      <path d="M92 198 L120 232 L98 240 L82 206 Z" fill="url(#camo-sm)" stroke="#232a1a" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M148 198 L120 232 L142 240 L158 206 Z" fill="url(#camo-sm)" stroke="#232a1a" strokeWidth={2.5} strokeLinejoin="round" />

      {/* 가슴 계급장 */}
      <rect x={109} y={244} width={22} height={18} rx={2} fill="#6f7d52" stroke="#232a1a" strokeWidth={1.5} />
      <RankBars x={113} y={248} w={14} />

      {/* 명찰 */}
      <rect x={56} y={248} width={44} height={15} rx={1.5} fill="#d8cfa8" stroke="#232a1a" strokeWidth={1.5} />
      <text x={78} y={259.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#1c1c1c" fontFamily="system-ui, sans-serif">
        이영준
      </text>

      {/* 가슴 주머니 */}
      <path d="M144 246 L184 246 L182 262 Q164 268 146 262 Z" fill="url(#camo-sm)" stroke="#232a1a" strokeWidth={2} strokeLinejoin="round" />

      {/* 귀 */}
      <ellipse cx={60} cy={142} rx={10} ry={14} fill={SKIN_SHADE} />
      <ellipse cx={180} cy={142} rx={10} ry={14} fill={SKIN_SHADE} />

      {/* 얼굴 */}
      <ellipse cx={120} cy={134} rx={60} ry={62} fill={SKIN} />
      {mood === 'angry' && <ellipse cx={120} cy={140} rx={60} ry={58} fill="url(#rage)" />}

      {/* 옆머리 (짧은 머리) */}
      <path d="M62 104 Q60 122 66 132 L70 104 Z" fill="#2b2420" />
      <path d="M178 104 Q180 122 174 132 L170 104 Z" fill="#2b2420" />

      {/* 전투모 */}
      <path d="M64 104 L70 44 Q120 32 170 44 L176 104 Z" fill="url(#camo)" stroke="#232a1a" strokeWidth={3} strokeLinejoin="round" />
      <path d="M70 44 Q120 52 170 44" stroke="#232a1a" strokeWidth={2} fill="none" opacity={0.5} />
      <path
        d="M54 102 Q120 88 186 102 Q190 113 178 116 Q120 106 62 116 Q50 113 54 102 Z"
        fill="#4d5a36"
        stroke="#232a1a"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* 모자 계급장 */}
      <rect x={107} y={60} width={26} height={20} rx={2} fill="#6f7d52" stroke="#232a1a" strokeWidth={1.5} />
      <RankBars x={112} y={64} w={16} />

      {/* 딱밤 자국 */}
      {bump && (
        <g className="yj-bump">
          <circle cx={120} cy={121} r={8} fill="#ff6b6b" />
          <circle cx={117} cy={118.5} r={2.5} fill="#ffc2c2" />
        </g>
      )}

      <Brows mood={mood} />
      <Eyes mood={mood} />

      {/* 코 */}
      <path d="M116 158 Q120 163 124 158" stroke={SKIN_SHADE} strokeWidth={3} strokeLinecap="round" fill="none" />

      {/* 볼 */}
      <ellipse cx={86} cy={163} rx={cheekR} ry={cheekR * 0.6} fill="#ff7f8a" opacity={cheek} />
      <ellipse cx={154} cy={163} rx={cheekR} ry={cheekR * 0.6} fill="#ff7f8a" opacity={cheek} />

      <Mouth mood={mood} />

      {/* 땀 */}
      {sweat && (
        <path className="yj-sweat" d="M176 108 Q184 120 180 126 Q174 130 170 124 Q168 118 176 108 Z" fill="#7cc7ff" stroke="#3a8fd0" strokeWidth={1.5} />
      )}

      {/* 분노 김 */}
      {mood === 'angry' && (
        <g className="yj-steam" fill="#f2f2f2" stroke="#bbb" strokeWidth={1.5}>
          <circle cx={46} cy={66} r={10} />
          <circle cx={36} cy={52} r={7} />
          <circle cx={194} cy={66} r={10} />
          <circle cx={204} cy={52} r={7} />
        </g>
      )}

      {/* 졸음 */}
      {mood === 'sleepy' && (
        <g className="yj-zzz" fill="#5b6cff" fontWeight={800} fontFamily="system-ui, sans-serif">
          <text x={184} y={60} fontSize={18}>Z</text>
          <text x={200} y={42} fontSize={14}>z</text>
          <text x={212} y={28} fontSize={11}>z</text>
        </g>
      )}
    </svg>
  )
}
