'use client'

import { useEffect, useState } from 'react'
import { Video } from '@/lib/api'

interface TranscriptModalProps {
  video: Video | null
  onClose: () => void
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'tiktok') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black text-white border border-gray-700">
        TikTok
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white">
      Instagram
    </span>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TranscriptModal({ video, onClose }: TranscriptModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!video) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [video, onClose])

  if (!video) return null

  async function handleCopy() {
    if (!video?.transcript) return
    await navigator.clipboard.writeText(video.transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-black/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl h-[92vh] sm:max-h-[90vh] sm:h-auto flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-black/15" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-black/8">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PlatformBadge platform={video.platform} />
              {video.language && (
                <span className="text-xs text-gray-400 bg-black/5 px-2 py-0.5 rounded-badge">
                  {video.language.toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-brand-dark font-semibold text-base leading-tight">
              {video.title || 'Sin título'}
            </h2>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue text-xs truncate transition-colors hover:underline"
            >
              {video.url}
            </a>
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-black/5 text-gray-500 px-2 py-0.5 rounded-badge">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
              <span>Guardado: {formatDate(video.created_at)}</span>
              {video.transcribed_at && <span>Transcrito: {formatDate(video.transcribed_at)}</span>}
            </div>
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-brand-dark transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Transcript body */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dark hover:bg-gray-800 rounded-badge text-xs text-white transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-brand-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
          <div className="overflow-y-auto h-full p-5 pt-12">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {video.transcript || 'Sin transcripción disponible.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
