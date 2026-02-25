'use client'

import { useState, useRef, useCallback } from 'react'
import type { MontageProject, MontageScene } from '@/store/useMontageStore'

// ─── Timing constants (identical to TheaterMode) ───
const NARRATION_DELAY = 3    // seconds before narration starts
const LINGER_AFTER = 5       // seconds after narration ends
const DEFAULT_DISPLAY = 5    // seconds for pages without narration
const TRANSITION_FADE_OUT = 1.5
const TRANSITION_BLACK = 0.8
const TRANSITION_FADE_IN = 1.5
const TRANSITION_TOTAL = TRANSITION_FADE_OUT + TRANSITION_BLACK + TRANSITION_FADE_IN

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080
const FPS = 30
const FRAME_DURATION = 1000 / FPS
const VIDEO_BITRATE = 5_000_000

export interface UseVideoExportReturn {
  isExporting: boolean
  progress: number
  currentScene: number
  totalScenes: number
  startExport: (project: MontageProject) => void
  cancelExport: () => void
}

// ─── Helpers ───

function getSceneDuration(scene: MontageScene): number {
  const hasNarration = !!(scene.narration?.audioUrl && scene.narration.duration > 0)
  if (hasNarration) {
    return NARRATION_DELAY + scene.narration.duration + LINGER_AFTER
  }
  return scene.displayDuration || DEFAULT_DISPLAY
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

async function loadAudioBuffer(
  audioCtx: AudioContext,
  url: string
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    const arrayBuffer = await response.arrayBuffer()
    return await audioCtx.decodeAudioData(arrayBuffer)
  } catch (e) {
    console.warn('Failed to load audio:', url, e)
    return null
  }
}

function drawTextWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ')
  let line = ''
  const lines: string[] = []

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)

  // Center vertically
  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight)
  }
}

// ─── Main hook ───

export function useVideoExport(): UseVideoExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentScene, setCurrentScene] = useState(0)
  const [totalScenes, setTotalScenes] = useState(0)
  const cancelledRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const cancelExport = useCallback(() => {
    cancelledRef.current = true
    cleanupRef.current?.()
  }, [])

  const startExport = useCallback(async (project: MontageProject) => {
    if (isExporting) return

    cancelledRef.current = false
    setIsExporting(true)
    setProgress(0)
    setCurrentScene(0)
    setTotalScenes(project.scenes.length)

    // ─── Setup canvas ───
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')!

    // ─── Setup audio context ───
    const audioCtx = new AudioContext()
    const dest = audioCtx.createMediaStreamDestination()

    // Keep track of active audio sources for cleanup
    const activeSources: AudioBufferSourceNode[] = []
    const activeGains: GainNode[] = []

    // ─── Setup MediaRecorder ───
    const videoStream = canvas.captureStream(FPS)
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ])

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: VIDEO_BITRATE,
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      if (!cancelledRef.current && chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.title || 'video'}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
      setIsExporting(false)
      setProgress(100)
    }

    // Cleanup function
    cleanupRef.current = () => {
      activeSources.forEach((s) => { try { s.stop() } catch {} })
      activeSources.length = 0
      if (recorder.state !== 'inactive') {
        try { recorder.stop() } catch {}
      }
      audioCtx.close().catch(() => {})
    }

    // ─── Preload all assets ───
    const sceneImages: (HTMLImageElement | null)[] = []
    const narrationBuffers: (AudioBuffer | null)[] = []
    const musicBuffers: Map<string, AudioBuffer> = new Map()
    const sfxBuffers: Map<string, AudioBuffer> = new Map()

    for (const scene of project.scenes) {
      // Image
      const media = scene.mediaTracks?.[0]
      if (media?.type === 'image' && media.url) {
        try {
          sceneImages.push(await loadImage(media.url))
        } catch {
          sceneImages.push(null)
        }
      } else {
        sceneImages.push(null)
      }

      // Narration
      if (scene.narration?.audioUrl) {
        narrationBuffers.push(await loadAudioBuffer(audioCtx, scene.narration.audioUrl))
      } else {
        narrationBuffers.push(null)
      }

      // Music
      const musicTrack = scene.musicTracks?.[0]
      if (musicTrack?.url && !musicBuffers.has(musicTrack.url)) {
        const buf = await loadAudioBuffer(audioCtx, musicTrack.url)
        if (buf) musicBuffers.set(musicTrack.url, buf)
      }

      // SFX
      for (const sfx of scene.soundTracks || []) {
        if (sfx.url && !sfxBuffers.has(sfx.url)) {
          const buf = await loadAudioBuffer(audioCtx, sfx.url)
          if (buf) sfxBuffers.set(sfx.url, buf)
        }
      }

      if (cancelledRef.current) {
        setIsExporting(false)
        audioCtx.close().catch(() => {})
        return
      }
    }

    // ─── Calculate total duration ───
    let totalDuration = 0
    const sceneDurations: number[] = []
    for (let i = 0; i < project.scenes.length; i++) {
      const dur = getSceneDuration(project.scenes[i])
      sceneDurations.push(dur)
      totalDuration += dur
      // Add transition between scenes (not after last)
      if (i < project.scenes.length - 1) {
        totalDuration += TRANSITION_TOTAL
      }
    }

    // ─── Start recording ───
    recorder.start(1000) // collect data every second

    // ─── Render scene by scene ───
    let globalElapsed = 0

    for (let sceneIdx = 0; sceneIdx < project.scenes.length; sceneIdx++) {
      if (cancelledRef.current) break

      const scene = project.scenes[sceneIdx]
      const sceneDuration = sceneDurations[sceneIdx]
      const image = sceneImages[sceneIdx]

      setCurrentScene(sceneIdx + 1)

      // ─── Start scene audio ───
      const hasNarration = !!(scene.narration?.audioUrl && narrationBuffers[sceneIdx])
      let narrationSource: AudioBufferSourceNode | null = null

      if (hasNarration && narrationBuffers[sceneIdx]) {
        narrationSource = audioCtx.createBufferSource()
        narrationSource.buffer = narrationBuffers[sceneIdx]!
        const gainNode = audioCtx.createGain()
        gainNode.gain.value = scene.narration.volume ?? 1
        narrationSource.connect(gainNode)
        gainNode.connect(dest)
        // Start narration after delay
        narrationSource.start(audioCtx.currentTime + NARRATION_DELAY)
        activeSources.push(narrationSource)
        activeGains.push(gainNode)
      }

      // Music
      const musicTrack = scene.musicTracks?.[0]
      let musicSource: AudioBufferSourceNode | null = null
      let musicGain: GainNode | null = null

      if (musicTrack?.url && musicBuffers.has(musicTrack.url)) {
        musicSource = audioCtx.createBufferSource()
        musicSource.buffer = musicBuffers.get(musicTrack.url)!
        musicSource.loop = musicTrack.loop !== false
        musicGain = audioCtx.createGain()
        const defaultVol = (project.defaultMusicVolume ?? 30) / 100
        const targetVol = musicTrack.volume ?? defaultVol
        musicGain.gain.value = 0
        // Fade in over 1.5s
        musicGain.gain.linearRampToValueAtTime(targetVol, audioCtx.currentTime + 1.5)
        musicSource.connect(musicGain)
        musicGain.connect(dest)
        musicSource.start(audioCtx.currentTime)
        activeSources.push(musicSource)
        activeGains.push(musicGain)
      }

      // SFX
      const sfxSources: AudioBufferSourceNode[] = []
      for (const sfx of scene.soundTracks || []) {
        if (sfx.url && sfxBuffers.has(sfx.url)) {
          const src = audioCtx.createBufferSource()
          src.buffer = sfxBuffers.get(sfx.url)!
          if (sfx.loop) src.loop = true
          const gain = audioCtx.createGain()
          gain.gain.value = sfx.volume ?? 0.7
          src.connect(gain)
          gain.connect(dest)
          const startAt = sfx.timeRange?.startTime || 0
          src.start(audioCtx.currentTime + startAt)
          // Schedule stop if endTime set
          const endAt = sfx.timeRange?.endTime
          if (endAt && endAt > startAt) {
            src.stop(audioCtx.currentTime + endAt)
          }
          activeSources.push(src)
          activeGains.push(gain)
          sfxSources.push(src)
        }
      }

      // ─── Render frames for this scene ───
      const totalFrames = Math.ceil(sceneDuration * FPS)

      for (let frame = 0; frame < totalFrames; frame++) {
        if (cancelledRef.current) break

        const sceneTime = frame / FPS

        // Draw frame
        drawSceneFrame(ctx, scene, image, sceneTime, sceneDuration, 1.0)

        // Update progress
        const overallProgress = ((globalElapsed + sceneTime) / totalDuration) * 100
        setProgress(Math.min(99, Math.round(overallProgress)))

        // Wait for next frame (real-time pacing for MediaRecorder)
        await sleep(FRAME_DURATION)
      }

      globalElapsed += sceneDuration

      // ─── Fade out music at end of scene ───
      if (musicGain && musicSource) {
        const now = audioCtx.currentTime
        musicGain.gain.linearRampToValueAtTime(0, now + TRANSITION_FADE_OUT)
        setTimeout(() => {
          try { musicSource!.stop() } catch {}
        }, TRANSITION_FADE_OUT * 1000 + 100)
      }

      // Stop SFX
      sfxSources.forEach((s) => { try { s.stop() } catch {} })

      // ─── Transition between scenes ───
      if (sceneIdx < project.scenes.length - 1 && !cancelledRef.current) {
        // Fade out
        const fadeOutFrames = Math.ceil(TRANSITION_FADE_OUT * FPS)
        for (let f = 0; f < fadeOutFrames; f++) {
          if (cancelledRef.current) break
          const opacity = 1 - f / fadeOutFrames
          drawSceneFrame(ctx, scene, image, sceneDuration, sceneDuration, opacity)
          await sleep(FRAME_DURATION)
        }

        // Black
        const blackFrames = Math.ceil(TRANSITION_BLACK * FPS)
        for (let f = 0; f < blackFrames; f++) {
          if (cancelledRef.current) break
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          await sleep(FRAME_DURATION)
        }

        // Fade in next scene
        const nextImage = sceneImages[sceneIdx + 1]
        const nextScene = project.scenes[sceneIdx + 1]
        const fadeInFrames = Math.ceil(TRANSITION_FADE_IN * FPS)
        for (let f = 0; f < fadeInFrames; f++) {
          if (cancelledRef.current) break
          const opacity = f / fadeInFrames
          drawSceneFrame(ctx, nextScene, nextImage, 0, sceneDurations[sceneIdx + 1], opacity)
          await sleep(FRAME_DURATION)
        }

        globalElapsed += TRANSITION_TOTAL
      }
    }

    // ─── Done ───
    if (!cancelledRef.current) {
      setProgress(100)
    }

    // Stop all active audio sources
    activeSources.forEach((s) => { try { s.stop() } catch {} })
    activeSources.length = 0

    // Stop recorder → triggers onstop → download
    if (recorder.state !== 'inactive') {
      recorder.stop()
    }

    audioCtx.close().catch(() => {})
  }, [isExporting])

  return {
    isExporting,
    progress,
    currentScene,
    totalScenes,
    startExport,
    cancelExport,
  }
}

// ─── Draw a single frame of a scene ───

function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  scene: MontageScene,
  image: HTMLImageElement | null,
  sceneTime: number,
  sceneDuration: number,
  globalOpacity: number
): void {
  // Clear
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (globalOpacity <= 0) return

  ctx.globalAlpha = globalOpacity

  if (image) {
    // ─── Blurred background ───
    ctx.save()
    ctx.filter = 'blur(40px) brightness(0.5)'
    // Draw zoomed 110% to cover edges
    const scale = 1.1
    const bw = CANVAS_WIDTH * scale
    const bh = CANVAS_HEIGHT * scale
    const bx = (CANVAS_WIDTH - bw) / 2
    const by = (CANVAS_HEIGHT - bh) / 2
    ctx.drawImage(image, bx, by, bw, bh)
    ctx.restore()

    // ─── Main image (object-contain) ───
    const imgRatio = image.naturalWidth / image.naturalHeight
    const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT
    let drawW: number, drawH: number
    if (imgRatio > canvasRatio) {
      drawW = CANVAS_WIDTH
      drawH = CANVAS_WIDTH / imgRatio
    } else {
      drawH = CANVAS_HEIGHT
      drawW = CANVAS_HEIGHT * imgRatio
    }
    const drawX = (CANVAS_WIDTH - drawW) / 2
    const drawY = (CANVAS_HEIGHT - drawH) / 2
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
  } else {
    // No image — gradient background
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  // ─── Gradient overlay ───
  const overlay = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, 0)
  overlay.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
  overlay.addColorStop(0.4, 'rgba(0, 0, 0, 0.1)')
  overlay.addColorStop(1, 'rgba(0, 0, 0, 0.2)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // ─── Progressive text ───
  if (scene.text) {
    const phrases =
      scene.text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()).filter(Boolean) ||
      [scene.text]

    const narrationDuration = scene.narration?.duration || 0
    const hasNarration = narrationDuration > 0
    const textDuration = hasNarration ? narrationDuration : (scene.displayDuration || DEFAULT_DISPLAY)
    const elapsed = hasNarration ? sceneTime - NARRATION_DELAY : sceneTime
    const textProgress = Math.max(0, Math.min(1, elapsed / textDuration))
    const visibleCount = Math.max(1, Math.ceil(textProgress * phrases.length))
    const currentPhrase = phrases[Math.min(visibleCount, phrases.length) - 1]

    if (currentPhrase) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Text shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // Font
      ctx.font = 'bold 48px "Georgia", "Times New Roman", serif'
      ctx.fillStyle = '#ffffff'

      const textY = CANVAS_HEIGHT - 200
      const maxWidth = CANVAS_WIDTH - 200

      drawTextWrapped(ctx, currentPhrase, CANVAS_WIDTH / 2, textY, maxWidth, 60)
      ctx.restore()
    }
  }

  // Reset alpha
  ctx.globalAlpha = 1.0
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
