'use client'

import { useCallback, useRef } from 'react'

export function useSoundFeedback() {
  const audioContext = useRef<AudioContext | null>(null)

  const initAudioContext = useCallback(() => {
    if (!audioContext.current && typeof window !== 'undefined') {
      const extendedWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext
      }
      const AudioContextConstructor = window.AudioContext ?? extendedWindow.webkitAudioContext
      if (AudioContextConstructor) {
        audioContext.current = new AudioContextConstructor()
      }
    }
    return audioContext.current
  }, [])

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const ctx = initAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }, [initAudioContext])

  const playClick = useCallback(() => {
    playTone(800, 0.1, 'square')
  }, [playTone])

  const playSuccess = useCallback(() => {
    playTone(600, 0.15, 'sine')
    setTimeout(() => playTone(800, 0.15, 'sine'), 100)
  }, [playTone])

  const playError = useCallback(() => {
    playTone(300, 0.2, 'sawtooth')
  }, [playTone])

  const hapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  return {
    playClick,
    playSuccess,
    playError,
    hapticFeedback
  }
}
