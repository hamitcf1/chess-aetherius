/**
 * Web Audio API ile sentezlenen satranç ses efektleri.
 * Dosya yüklemeye gerek yok — anında çalar.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        } catch {
            return null
        }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
    }
    return audioCtx
}

interface ToneOptions {
    freq: number
    duration: number
    type?: OscillatorType
    volume?: number
    attack?: number
    decay?: number
}

function playTone({ freq, duration, type = 'sine', volume = 0.15, attack = 0.01, decay = 0.1 }: ToneOptions): void {
    const ctx = getCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
}

function playChord(freqs: number[], duration: number, volume = 0.12): void {
    freqs.forEach((f, i) => {
        setTimeout(() => playTone({ freq: f, duration, type: 'sine', volume, attack: 0.02, decay: duration }), i * 60)
    })
}

export const Sounds = {
    move() {
        playTone({ freq: 320, duration: 0.08, type: 'square', volume: 0.06, attack: 0.001, decay: 0.07 })
    },
    capture() {
        playTone({ freq: 180, duration: 0.12, type: 'square', volume: 0.10, attack: 0.001, decay: 0.11 })
        setTimeout(() => playTone({ freq: 120, duration: 0.08, type: 'square', volume: 0.06 }), 30)
    },
    check() {
        playTone({ freq: 880, duration: 0.15, type: 'triangle', volume: 0.12 })
        setTimeout(() => playTone({ freq: 660, duration: 0.18, type: 'triangle', volume: 0.10 }), 80)
    },
    victory() {
        playChord([523.25, 659.25, 783.99, 1046.50], 0.35, 0.15) // C5 E5 G5 C6
    },
    defeat() {
        playTone({ freq: 220, duration: 0.4, type: 'sawtooth', volume: 0.10, attack: 0.02, decay: 0.38 })
        setTimeout(() => playTone({ freq: 165, duration: 0.4, type: 'sawtooth', volume: 0.10, attack: 0.02, decay: 0.38 }), 200)
    },
    draw() {
        playTone({ freq: 440, duration: 0.2, type: 'sine', volume: 0.10 })
    },
    achievement() {
        // Magical sparkly sound
        playChord([783.99, 987.77, 1318.51], 0.25, 0.13)
    },
    select() {
        playTone({ freq: 440, duration: 0.04, type: 'sine', volume: 0.04 })
    },
    error() {
        playTone({ freq: 200, duration: 0.12, type: 'square', volume: 0.08 })
    },
}

/** Wrapper that respects user's sound settings. */
export function makeSoundPlayer(getEnabled: () => { master: boolean; move: boolean; capture: boolean; victory: boolean }) {
    return {
        move: () => { const s = getEnabled(); if (s.master && s.move) Sounds.move() },
        capture: () => { const s = getEnabled(); if (s.master && s.capture) Sounds.capture() },
        check: () => { const s = getEnabled(); if (s.master) Sounds.check() },
        victory: () => { const s = getEnabled(); if (s.master && s.victory) Sounds.victory() },
        defeat: () => { const s = getEnabled(); if (s.master && s.victory) Sounds.defeat() },
        draw: () => { const s = getEnabled(); if (s.master) Sounds.draw() },
        achievement: () => { const s = getEnabled(); if (s.master) Sounds.achievement() },
        select: () => { const s = getEnabled(); if (s.master) Sounds.select() },
        error: () => { const s = getEnabled(); if (s.master) Sounds.error() },
    }
}
