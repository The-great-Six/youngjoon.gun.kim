import type { ToolId } from './data'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  when = 0,
  slideTo?: number,
  gain = 0.12,
) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + when
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function playHit(tool: ToolId) {
  switch (tool) {
    case 'poke':
      tone(520 + Math.random() * 120, 0.09, 'triangle', 0, 900)
      break
    case 'tickle':
      for (let i = 0; i < 3; i++) tone(700 + i * 120, 0.06, 'sine', i * 0.05)
      break
    case 'pinch':
      tone(300, 0.18, 'sawtooth', 0, 700, 0.07)
      break
    case 'flick':
      tone(1400, 0.05, 'square', 0, 200, 0.08)
      tone(180, 0.2, 'sine', 0.03, 60, 0.18)
      break
    case 'bugle':
      ;[392, 523, 659, 784].forEach((f, i) => {
        tone(f, 0.12, 'square', i * 0.09, undefined, 0.06)
      })
      break
  }
}

export function playRage() {
  tone(220, 0.5, 'sawtooth', 0, 80, 0.1)
  tone(330, 0.5, 'sawtooth', 0.05, 110, 0.07)
}

export function playBuy() {
  tone(660, 0.08, 'triangle')
  tone(990, 0.12, 'triangle', 0.07)
}
