import { tone } from '../../../shared/audio'

/** 뒤적이는 소리 한 번 */
export function playRummage() {
  tone(140 + Math.random() * 120, 0.05, 'triangle', 0, undefined, 0.05)
}

export function playWarn() {
  tone(880, 0.07, 'sine', 0, undefined, 0.08)
  tone(1100, 0.09, 'sine', 0.09, undefined, 0.08)
}

export function playCaught() {
  tone(240, 0.45, 'sawtooth', 0, 80, 0.1)
  tone(180, 0.45, 'square', 0.04, 60, 0.05)
}

export function playFound(isNew: boolean) {
  const notes = isNew ? [523, 659, 784, 1047] : [523, 659]
  notes.forEach((f, i) => {
    tone(f, 0.12, 'triangle', i * 0.08, undefined, 0.09)
  })
}

export function playEnding() {
  ;[392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => {
    tone(f, 0.16, 'triangle', i * 0.11, undefined, 0.09)
  })
}
