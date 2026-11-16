let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** 짧은 효과음 한 음. slideTo를 주면 그 주파수까지 미끄러진다. */
export function tone(
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
