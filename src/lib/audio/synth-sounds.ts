'use client'

// =============================================================================
// GÉNÉRATEUR DE SONS SYNTHÉTIQUES
// Utilise Web Audio API pour créer des sons sans fichiers audio
// =============================================================================

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// =============================================================================
// SONS DE BASE
// =============================================================================

export function playChime(frequency = 800, duration = 0.5, volume = 0.3) {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  // Oscillateur principal (son de carillon)
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(frequency, now)
  osc1.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + duration)

  // Deuxième oscillateur pour l'harmonique
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(frequency * 2, now)
  osc2.frequency.exponentialRampToValueAtTime(frequency, now + duration)

  // Gain (volume avec envelope ADSR)
  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01) // Attack rapide
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.1) // Decay
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration) // Release

  // Connexions
  osc1.connect(gainNode)
  osc2.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Démarrer et arrêter
  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + duration)
  osc2.stop(now + duration)
}

export function playMagicSparkle(volume = 0.2) {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  // Plusieurs notes rapides pour l'effet "sparkle"
  const frequencies = [1200, 1500, 1800, 2000, 1600]
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.05)
    
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now + i * 0.05)
    gain.gain.linearRampToValueAtTime(volume, now + i * 0.05 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start(now + i * 0.05)
    osc.stop(now + i * 0.05 + 0.15)
  })
}

export function playWhoosh(volume = 0.3) {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const duration = 0.4

  // Bruit blanc filtré pour le whoosh
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // Filtre passe-bas qui sweep
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(100, now)
  filter.frequency.exponentialRampToValueAtTime(2000, now + duration * 0.3)
  filter.frequency.exponentialRampToValueAtTime(200, now + duration)
  filter.Q.value = 1

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.05)
  gain.gain.linearRampToValueAtTime(volume * 0.5, now + duration * 0.5)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  noise.start(now)
  noise.stop(now + duration)
}

export function playBell(frequency = 440, volume = 0.3) {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const duration = 1.5

  // Son de cloche avec plusieurs harmoniques
  const harmonics = [1, 2.4, 3, 4.2, 5.4]
  const gains = [1, 0.6, 0.4, 0.25, 0.2]

  harmonics.forEach((harmonic, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency * harmonic, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume * gains[i], now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * (1 - i * 0.1))

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  })
}

export function playPop(volume = 0.4) {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.1)
}

// =============================================================================
// MAPPING DES SONS
// =============================================================================

export type SynthSoundId = 
  | 'chime' 
  | 'magic-sparkle' 
  | 'whoosh' 
  | 'bell' 
  | 'bells'
  | 'pop'
  | 'magic-chime'

const SYNTH_SOUNDS: Record<SynthSoundId, () => void> = {
  'chime': () => playChime(800, 0.5, 0.3),
  'magic-sparkle': () => playMagicSparkle(0.2),
  'whoosh': () => playWhoosh(0.3),
  'bell': () => playBell(440, 0.3),
  'bells': () => playBell(880, 0.25),
  'pop': () => playPop(0.4),
  'magic-chime': () => {
    playChime(1047, 0.3, 0.2) // Do aigu
    setTimeout(() => playChime(1319, 0.3, 0.2), 100) // Mi
    setTimeout(() => playChime(1568, 0.4, 0.2), 200) // Sol
  },
}

// Jouer un son par son ID
export function playSynthSound(soundId: string, volume = 1): boolean {
  // Vérifier si c'est un son synthétique disponible
  const normalizedId = soundId.toLowerCase().replace(/_/g, '-')
  
  // Mapper certains IDs de la bibliothèque vers les sons synthétiques
  const mapping: Record<string, SynthSoundId> = {
    'chime': 'chime',
    'magic-sparkle': 'magic-sparkle',
    'magic-chime': 'magic-chime',
    'whoosh': 'whoosh',
    'magic-whoosh': 'whoosh',
    'bell': 'bell',
    'bells': 'bells',
    'pop': 'pop',
    'magic-pop': 'pop',
  }
  
  const synthId = mapping[normalizedId]
  
  if (synthId && SYNTH_SOUNDS[synthId]) {
    try {
      SYNTH_SOUNDS[synthId]()
      return true
    } catch (e) {
      console.warn('Erreur lors de la lecture du son synthétique:', e)
      return false
    }
  }
  
  return false
}

// Vérifier si un son peut être joué en synthétique
export function hasSynthSound(soundId: string): boolean {
  const normalizedId = soundId.toLowerCase().replace(/_/g, '-')
  const mapping: Record<string, boolean> = {
    'chime': true,
    'magic-sparkle': true,
    'magic-chime': true,
    'whoosh': true,
    'magic-whoosh': true,
    'bell': true,
    'bells': true,
    'pop': true,
    'magic-pop': true,
  }
  return !!mapping[normalizedId]
}
