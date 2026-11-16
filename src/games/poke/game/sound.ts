import { tone } from '../../../shared/audio'
import type { ToolId } from './data'

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
