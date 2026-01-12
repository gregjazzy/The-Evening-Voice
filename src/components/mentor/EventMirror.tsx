'use client'

import { useEffect, useRef } from 'react'
import { useMentorStore } from '@/store/useMentorStore'
import { useAppStore } from '@/store/useAppStore'

/**
 * Composant invisible qui capture les événements du mentor
 * et les envoie aux enfants via le serveur de signaling
 */
export function EventMirror() {
  const { 
    role, 
    controlActive, 
    sendCursorMove, 
    sendClick, 
    sendKeyboardInput,
    sendModeChange 
  } = useMentorStore()
  
  const { currentMode } = useAppStore()
  const lastModeRef = useRef(currentMode)
  const throttleRef = useRef<number>(0)

  // Capturer les mouvements de souris du mentor
  useEffect(() => {
    if (role !== 'mentor' || !controlActive) return

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle à 60fps max
      const now = Date.now()
      if (now - throttleRef.current < 16) return
      throttleRef.current = now

      sendCursorMove(e.clientX, e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [role, controlActive, sendCursorMove])

  // Capturer les clics du mentor
  useEffect(() => {
    if (role !== 'mentor' || !controlActive) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Générer un sélecteur unique pour l'élément
      let selector = ''
      if (target.id) {
        selector = `#${target.id}`
      } else if (target.dataset.mentorTarget) {
        selector = `[data-mentor-target="${target.dataset.mentorTarget}"]`
      } else if (target.className) {
        // Utiliser les classes principales
        const classes = target.className.split(' ').slice(0, 2).join('.')
        selector = `.${classes}`
      }

      sendClick(selector, e.clientX, e.clientY)
    }

    // Utiliser capture pour intercepter avant les handlers normaux
    window.addEventListener('click', handleClick, { capture: true })
    return () => window.removeEventListener('click', handleClick, { capture: true })
  }, [role, controlActive, sendClick])

  // Capturer les saisies clavier du mentor
  useEffect(() => {
    if (role !== 'mentor' || !controlActive) return

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement
      if (!target.tagName || !['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      let selector = ''
      if (target.id) {
        selector = `#${target.id}`
      } else if (target.name) {
        selector = `[name="${target.name}"]`
      } else if (target.dataset.mentorTarget) {
        selector = `[data-mentor-target="${target.dataset.mentorTarget}"]`
      }

      sendKeyboardInput(selector, target.value, '')
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      if (e.key === 'Enter') {
        const inputTarget = target as HTMLInputElement
        let selector = ''
        if (inputTarget.id) {
          selector = `#${inputTarget.id}`
        } else if (inputTarget.name) {
          selector = `[name="${inputTarget.name}"]`
        }
        sendKeyboardInput(selector, inputTarget.value, 'Enter')
      }
    }

    window.addEventListener('input', handleInput)
    window.addEventListener('keypress', handleKeyPress)
    return () => {
      window.removeEventListener('input', handleInput)
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [role, controlActive, sendKeyboardInput])

  // Synchroniser les changements de mode
  useEffect(() => {
    if (role !== 'mentor' || !controlActive) return
    
    if (currentMode !== lastModeRef.current) {
      lastModeRef.current = currentMode
      sendModeChange(currentMode)
    }
  }, [role, controlActive, currentMode, sendModeChange])

  return null
}

