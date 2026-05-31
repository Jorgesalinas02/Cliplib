'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createVideo } from '@/lib/api'
import { Suspense } from 'react'

type State = 'saving' | 'done' | 'duplicate' | 'error' | 'invalid'

function ShareHandler() {
  const params = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>('saving')
  const [url, setUrl] = useState('')

  useEffect(() => {
    // Instagram/TikTok send the URL in ?url= or embedded in ?text=
    const raw =
      params.get('url') ||
      params.get('text')?.match(/https?:\/\/\S+/)?.[0] ||
      ''

    if (!raw) {
      setState('invalid')
      return
    }

    setUrl(raw)

    createVideo(raw)
      .then(() => {
        setState('done')
        setTimeout(() => router.push('/'), 1800)
      })
      .catch((err: Error) => {
        if (err.message.includes('ya está') || err.message.includes('409')) {
          setState('duplicate')
        } else if (err.message.includes('soportad') || err.message.includes('válid')) {
          setState('invalid')
        } else {
          setState('error')
        }
        setTimeout(() => router.push('/'), 2500)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const config: Record<State, { icon: string; title: string; subtitle: string; color: string }> = {
    saving: {
      icon: '⏳',
      title: 'Guardando video...',
      subtitle: 'Esto toma un segundo',
      color: 'text-gray-500',
    },
    done: {
      icon: '✅',
      title: '¡Video guardado!',
      subtitle: 'La transcripción comenzará en breve',
      color: 'text-green-600',
    },
    duplicate: {
      icon: '📌',
      title: 'Ya estaba guardado',
      subtitle: 'Este video ya está en tu biblioteca',
      color: 'text-yellow-600',
    },
    error: {
      icon: '⚠️',
      title: 'Error al guardar',
      subtitle: 'Regresando a la app...',
      color: 'text-red-500',
    },
    invalid: {
      icon: '🚫',
      title: 'URL no soportada',
      subtitle: 'Solo TikTok e Instagram',
      color: 'text-red-500',
    },
  }

  const { icon, title, subtitle, color } = config[state]

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
      <div className="bg-white border border-black/8 rounded-card p-8 max-w-sm w-full text-center shadow-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <span className="text-lg font-bold text-brand-dark">Cliplib</span>
          <span className="w-2 h-2 rounded-full bg-brand-olive" />
        </div>

        {/* Icon */}
        <div className="text-5xl mb-4">{icon}</div>

        {/* Status */}
        <p className={`text-base font-semibold ${color} mb-1`}>{title}</p>
        <p className="text-gray-400 text-sm">{subtitle}</p>

        {/* URL preview */}
        {url && (
          <p className="mt-4 text-xs text-gray-400 bg-black/5 rounded-card px-3 py-2 truncate">
            {url}
          </p>
        )}

        {/* Spinner for saving state */}
        {state === 'saving' && (
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-black/15 border-t-brand-dark rounded-full animate-spin" />
          </div>
        )}

        {/* Go to app button for error/invalid */}
        {(state === 'error' || state === 'invalid') && (
          <button
            onClick={() => router.push('/')}
            className="mt-6 w-full py-2.5 bg-brand-dark text-white rounded-badge text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Ir a Cliplib
          </button>
        )}
      </div>
    </main>
  )
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareHandler />
    </Suspense>
  )
}
