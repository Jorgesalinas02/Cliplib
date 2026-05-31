'use client'

import { useState, FormEvent, useEffect } from 'react'
import { createVideo } from '@/lib/api'

interface AddVideoBarProps {
  onSuccess: () => void
  prefillUrl?: string
}

export default function AddVideoBar({ onSuccess, prefillUrl }: AddVideoBarProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [showTitle, setShowTitle] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill and submit when coming from ?save= or share sheet
  useEffect(() => {
    if (!prefillUrl) return
    setUrl(prefillUrl)
    // Auto-submit after a short delay so the user sees the URL
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        await createVideo(prefillUrl)
        setUrl('')
        onSuccess()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar el video')
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUrl])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim()) { setError('Ingresa una URL válida'); return }
    setError(null)
    setLoading(true)
    try {
      await createVideo(url.trim(), title.trim() || undefined)
      setUrl('')
      setTitle('')
      setShowTitle(false)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega una URL de TikTok o Instagram..."
            className="flex-1 bg-white border border-black/10 rounded-card px-4 py-2.5 text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-blue/60 transition-colors text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowTitle((v) => !v)}
            className="px-3 py-2.5 bg-white border border-black/10 rounded-card text-gray-400 hover:text-brand-dark hover:border-black/20 transition-colors text-sm"
            title="Agregar título"
          >
            +T
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-brand-dark hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-badge text-white font-semibold text-sm transition-colors flex items-center gap-2 border border-gray-700"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>

        {showTitle && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título opcional..."
            className="bg-white border border-black/10 rounded-card px-4 py-2.5 text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-blue/60 transition-colors text-sm"
            disabled={loading}
          />
        )}

        {error && <p className="text-red-400 text-sm px-1">{error}</p>}
      </div>
    </form>
  )
}
