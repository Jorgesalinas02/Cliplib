'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, deleteVideo, retryVideo, updateVideo, CATEGORIES } from '@/lib/api'
import { usePolling } from '@/hooks/usePolling'
import { CATEGORY_COLORS } from '@/components/CategoryFilter'
import Tooltip from '@/components/Tooltip'

interface VideoCardProps {
  video: Video
  onDelete: () => void
  onUpdate: () => void
  onRetry: () => void
  onTagClick: (tag: string) => void
  onViewTranscript: (video: Video) => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.hostname.replace('www.', '') + u.pathname
    return path.length > 30 ? path.slice(0, 30) + '...' : path
  } catch {
    return url.slice(0, 30) + '...'
  }
}

// Platform header backgrounds
function CardHeader({ platform, status }: { platform: string; status: string }) {
  const isTikTok = platform === 'tiktok'

  return (
    <div
      className={`relative h-36 rounded-t-card flex items-center justify-center overflow-hidden
        ${isTikTok
          ? 'bg-brand-dark'
          : 'bg-gradient-to-br from-orange-400 via-pink-500 to-red-500'
        }`}
    >
      {/* Platform icon */}
      {isTikTok ? (
        <svg className="w-12 h-12 text-white opacity-90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.29 8.29 0 004.84 1.55V7.05a4.85 4.85 0 01-1.07-.36z"/>
        </svg>
      ) : (
        <svg className="w-12 h-12 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
      )}

      {/* Platform badge — top left */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-badge text-xs font-semibold tracking-wide bg-white/15 backdrop-blur-sm text-white">
        {isTikTok ? 'TikTok' : 'Instagram'}
      </span>

      {/* Status pill — bottom right */}
      <div className="absolute bottom-3 right-3">
        <StatusPill status={status} />
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-xs font-medium bg-brand-yellow text-brand-dark shadow-sm">
          En cola
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-xs font-medium bg-brand-pink text-brand-dark shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-dark animate-pulse" />
          Transcribiendo
        </span>
      )
    case 'done':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-xs font-medium bg-brand-olive text-brand-dark shadow-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Transcrito
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-xs font-medium bg-red-100 text-red-600 shadow-sm">
          Error
        </span>
      )
    default:
      return null
  }
}

function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category]
  if (!colors) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium ${colors.bg} ${colors.text}`}>
      {category}
    </span>
  )
}

function CategoryPicker({ current, onSelect }: { current: string | null; onSelect: (cat: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Cambiar categoría"
        className="w-9 h-9 flex items-center justify-center rounded-card border border-black/10 bg-white hover:border-black/20 hover:bg-black/5 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16"/>
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-black/10 rounded-card shadow-lg p-1.5 min-w-[180px]">
          <p className="text-xs text-gray-400 px-2 py-1 font-medium uppercase tracking-wider">Categoría</p>
          {current && (
            <button
              onClick={() => { onSelect(null); setOpen(false) }}
              className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-black/5 text-gray-400 transition-colors"
            >
              — Sin categoría
            </button>
          )}
          {CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat]
            return (
              <button
                key={cat}
                onClick={() => { onSelect(cat); setOpen(false) }}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2 ${
                  current === cat ? `${colors.bg} ${colors.text} font-medium` : 'hover:bg-black/5 text-gray-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colors.activeBg}`} />
                {cat}
                {current === cat && (
                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IconButton({ onClick, tooltip, children, disabled }: {
  onClick?: () => void
  tooltip?: string
  children: React.ReactNode
  disabled?: boolean
}) {
  const btn = (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 flex items-center justify-center rounded-card border border-black/10 bg-white hover:border-black/20 hover:bg-black/5 transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  )
  if (!tooltip) return btn
  return <Tooltip text={tooltip}>{btn}</Tooltip>
}

export default function VideoCard({
  video: initialVideo,
  onDelete,
  onUpdate,
  onRetry,
  onTagClick,
  onViewTranscript,
}: VideoCardProps) {
  const polled = usePolling(initialVideo.id, initialVideo.status)
  const video = polled ?? initialVideo

  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [localCategory, setLocalCategory] = useState<string | null>(initialVideo.category)
  const [localSaved, setLocalSaved] = useState(initialVideo.saved)
  const [localTitle, setLocalTitle] = useState(initialVideo.title ?? '')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(initialVideo.title ?? '')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Keep in sync if polled data updates
  useEffect(() => {
    setLocalCategory(video.category)
    setLocalSaved(video.saved)
  }, [video.category, video.saved])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  function startEditTitle() {
    setTitleDraft(localTitle)
    setEditingTitle(true)
  }

  async function saveTitle() {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (trimmed === localTitle) return
    setLocalTitle(trimmed)
    try {
      await updateVideo(video.id, { title: trimmed })
      onUpdate()
    } catch {
      setLocalTitle(localTitle) // revert
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveTitle()
    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(localTitle) }
  }

  async function handleToggleSaved() {
    const next = !localSaved
    setLocalSaved(next)
    try {
      await updateVideo(video.id, { saved: next })
      onUpdate()
    } catch {
      setLocalSaved(localSaved) // revert
    }
  }

  async function handleCategoryChange(cat: string | null) {
    setLocalCategory(cat)
    try {
      await updateVideo(video.id, { category: cat ?? '' })
      onUpdate()
    } catch {
      setLocalCategory(video.category) // revert on error
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este video?')) return
    setDeleting(true)
    try {
      await deleteVideo(video.id)
      onDelete()
    } finally {
      setDeleting(false)
    }
  }

  async function handleRetry() {
    setRetrying(true)
    try {
      await retryVideo(video.id)
      onRetry()
    } finally {
      setRetrying(false)
    }
  }

  async function handleCopy() {
    if (!video.transcript) return
    await navigator.clipboard.writeText(video.transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group bg-white border border-black/8 rounded-card overflow-hidden hover:shadow-md hover:border-black/12 transition-all flex flex-col">

      {/* Colored header + bookmark button */}
      <div className="relative">
        <CardHeader platform={video.platform} status={video.status} />
        <button
          onClick={handleToggleSaved}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-badge text-xs font-semibold transition-all shadow-md
            ${localSaved
              ? 'bg-brand-yellow text-brand-dark'
              : 'bg-white text-brand-dark hover:bg-brand-yellow'
            }`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill={localSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          {localSaved ? 'Grabado' : 'Grabar'}
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Title editable + URL + date */}
        <div className="flex flex-col gap-1">

          {/* Inline title editor */}
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              placeholder="Escribe un título..."
              maxLength={120}
              className="w-full text-brand-dark font-bold text-sm leading-snug bg-brand-bg border border-brand-blue/40 rounded-card px-2 py-1 outline-none focus:border-brand-blue transition-colors"
            />
          ) : (
            <button
              onClick={startEditTitle}
              className="text-left group/title w-full"
              title="Editar título"
            >
              {localTitle ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-brand-dark font-bold text-sm leading-snug line-clamp-2">
                    {localTitle}
                  </span>
                  <svg className="w-3 h-3 text-gray-300 group-hover/title:text-gray-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </span>
              ) : (
                <span className="text-gray-300 text-xs italic group-hover/title:text-gray-400 transition-colors">
                  + Agregar título...
                </span>
              )}
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brand-dark text-xs transition-colors truncate"
            >
              {truncateUrl(video.url)}
            </a>
            <span className="text-gray-400 text-xs shrink-0">{formatDate(video.created_at)}</span>
          </div>
        </div>

        {/* Tags + Category */}
        {(video.tags.length > 0 || localCategory) && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {localCategory && <CategoryBadge category={localCategory} />}
            {video.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="text-xs bg-black/5 hover:bg-black/10 text-gray-500 hover:text-brand-dark px-2.5 py-0.5 rounded-badge transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Status-specific content */}
        {video.status === 'pending' && (
          <p className="text-gray-400 text-xs italic">En cola para transcribir...</p>
        )}

        {video.status === 'processing' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-brand-pink">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-xs font-medium">Extrayendo audio y transcribiendo...</span>
            </div>
            <div className="w-full h-1.5 bg-black/8 rounded-full overflow-hidden">
              <div className="h-full bg-brand-pink rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite] w-1/2" />
            </div>
            <span className="text-gray-400 text-xs text-right">~2 min restantes</span>
          </div>
        )}

        {video.status === 'done' && video.transcript && (
          <div className="bg-brand-bg rounded-card p-3 border border-black/5">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
              Transcripción
            </p>
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{video.transcript}</p>
          </div>
        )}

        {video.status === 'failed' && video.error_message && (
          <p className="text-red-500 text-xs leading-relaxed bg-red-50 rounded-card p-3">{video.error_message}</p>
        )}

        {/* Actions footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/6">

          <div className="flex items-center gap-2">
            {/* Copy */}
            {video.status === 'done' && (
              <IconButton
                onClick={handleCopy}
                tooltip={copied ? '¡Copiado!' : 'Copiar transcripción'}
              >
                {copied ? (
                  <svg className="w-4 h-4 text-brand-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                )}
              </IconButton>
            )}

            {/* Open URL */}
            <Tooltip text="Abrir video original">
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <IconButton>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </IconButton>
              </a>
            </Tooltip>

            {/* Category picker */}
            <Tooltip text="Asignar categoría">
              <div><CategoryPicker current={localCategory} onSelect={handleCategoryChange} /></div>
            </Tooltip>

            {/* Delete */}
            <IconButton onClick={handleDelete} tooltip="Eliminar video" disabled={deleting}>
              <svg className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </IconButton>

            {/* Retry (failed only) */}
            {video.status === 'failed' && (
              <IconButton onClick={handleRetry} tooltip="Reintentar transcripción" disabled={retrying}>
                <svg className="w-4 h-4 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </IconButton>
            )}
          </div>

          {/* Ver completo */}
          {video.status === 'done' && (
            <Tooltip text="Ver transcripción completa" position="top">
              <button
                onClick={() => onViewTranscript(video)}
                className="text-xs font-medium text-brand-dark hover:text-brand-pink transition-colors flex items-center gap-1"
              >
                Ver completo →
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
