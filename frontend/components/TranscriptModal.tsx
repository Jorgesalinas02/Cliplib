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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PlatformBadge platform={video.platform} />
              {video.language && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {video.language.toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-white font-semibold text-lg leading-tight">
              {video.title || 'Sin título'}
            </h2>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-xs truncate transition-colors"
            >
              {video.url}
            </a>
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>Guardado: {formatDate(video.created_at)}</span>
              {video.transcribed_at && (
                <span>Transcrito: {formatDate(video.transcribed_at)}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transcript body */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
          <div className="overflow-y-auto h-full p-5 pt-12">
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {video.transcript || 'Sin transcripción disponible.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
