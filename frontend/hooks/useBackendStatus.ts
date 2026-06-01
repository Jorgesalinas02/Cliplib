'use client'

import { useState, useEffect } from 'react'

type Status = 'checking' | 'warming' | 'ready' | 'error'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cliplib.onrender.com'
const SLOW_THRESHOLD_MS = 2500   // si tarda más de esto, mostramos "warming up"

export function useBackendStatus() {
  const [status, setStatus] = useState<Status>('checking')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    let timer: ReturnType<typeof setInterval>

    // Si tarda más de 2.5s mostramos el aviso de warming
    const slowTimer = setTimeout(() => {
      setStatus('warming')
      // Contador de segundos
      timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000))
      }, 1000)
    }, SLOW_THRESHOLD_MS)

    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(() => {
        clearTimeout(slowTimer)
        clearInterval(timer)
        setStatus('ready')
      })
      .catch(() => {
        clearTimeout(slowTimer)
        clearInterval(timer)
        setStatus('error')
      })

    return () => {
      clearTimeout(slowTimer)
      clearInterval(timer)
    }
  }, [])

  return { status, elapsed }
}
