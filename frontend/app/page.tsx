'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Video, CATEGORIES } from '@/lib/api'
import { useVideos } from '@/hooks/useVideos'
import AddVideoBar from '@/components/AddVideoBar'
import VideoCard from '@/components/VideoCard'
import FilterChips from '@/components/FilterChips'
import TranscriptModal from '@/components/TranscriptModal'
import { CATEGORY_COLORS } from '@/components/CategoryFilter'
import Nav from '@/components/Nav'

// ── Stat card ────────────────────────────────────────────────
function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white border border-black/8 rounded-card px-5 py-4 flex-1 min-w-0">
      <p className="text-2xl font-bold text-brand-dark leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1.5">{label}</p>
    </div>
  )
}

// ── Category + Search bar ────────────────────────────────────
function CategorySearchBar({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearch,
}: {
  activeCategory: string | undefined
  onCategoryChange: (cat: string | undefined) => void
  searchQuery: string
  onSearch: (q: string) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* "Todos" pill */}
      <button
        onClick={() => onCategoryChange(undefined)}
        className={`px-4 py-1.5 rounded-badge text-sm font-medium border transition-colors ${
          !activeCategory
            ? 'border-brand-dark text-brand-dark bg-white font-semibold'
            : 'border-black/15 text-gray-500 bg-white hover:border-black/30 hover:text-brand-dark'
        }`}
      >
        Todos
      </button>

      {/* Category pills */}
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat
        const colors = CATEGORY_COLORS[cat]
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(isActive ? undefined : cat)}
            className={`px-4 py-1.5 rounded-badge text-sm font-medium border transition-colors ${
              isActive
                ? `border-brand-dark text-brand-dark bg-white font-semibold`
                : 'border-black/15 text-gray-500 bg-white hover:border-black/30 hover:text-brand-dark'
            }`}
          >
            {cat}
          </button>
        )
      })}

      {/* Search toggle */}
      {searchOpen ? (
        <div className="flex items-center gap-1 bg-white border border-black/15 rounded-badge px-3 py-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-36 text-sm bg-transparent outline-none text-brand-dark placeholder-gray-400"
          />
          <button onClick={() => { onSearch(''); setSearchOpen(false) }} className="text-gray-400 hover:text-brand-dark ml-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-badge border border-black/15 bg-white hover:border-black/30 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
function HomeContent() {
  const searchParams = useSearchParams()
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [prefillUrl, setPrefillUrl] = useState<string>('')

  // Support ?save=URL direct links
  useEffect(() => {
    const saveUrl = searchParams.get('save')
    if (saveUrl) setPrefillUrl(saveUrl)
  }, [searchParams])

  // Load all non-saved videos for accurate stats
  const { videos: allVideos, isLoading: allLoading, mutate: mutateAll } = useVideos({ saved: false })

  // Filtered view — only non-saved videos in the main dashboard
  const { videos, isLoading, mutate } = useVideos({
    tags: activeTags,
    q: searchQuery,
    category: activeCategory,
    saved: false,
  })

  function handleMutate() {
    mutate()
    mutateAll()
  }

  const doneCount      = allVideos.filter((v) => v.status === 'done').length
  const processingCount = allVideos.filter((v) => v.status === 'processing' || v.status === 'pending').length
  const categoriesCount = new Set(allVideos.map((v) => v.category).filter(Boolean)).size

  function handleTagToggle(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSearch = useCallback((q: string) => setSearchQuery(q), [])

  const isFiltered = activeTags.length > 0 || searchQuery || activeCategory

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Logo + Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Cliplib</h1>
            <span className="w-2 h-2 rounded-full bg-brand-olive" />
          </div>
          <Nav active="biblioteca" />
        </div>

        {/* Add video bar */}
        <AddVideoBar onSuccess={handleMutate} prefillUrl={prefillUrl} />

        {/* Stats row */}
        {!allLoading && (
          <div className="flex gap-3">
            <StatCard value={allVideos.length} label="videos guardados" />
            <StatCard value={doneCount}        label="transcritos" />
            <StatCard value={processingCount}  label="procesando" />
            <StatCard value={categoriesCount}  label="categorías" />
          </div>
        )}

        {/* Category + Search */}
        <CategorySearchBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearch={handleSearch}
        />

        {/* Tag chips (secondary filter) */}
        <FilterChips
          activeTags={activeTags}
          onTagToggle={handleTagToggle}
          onClearAll={() => setActiveTags([])}
        />

        {/* Video grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/60 border border-black/5 rounded-card p-4 h-52 animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-black/8 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.883v6.234a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </div>
            <p className="text-brand-dark font-medium">
              {isFiltered ? 'No hay videos que coincidan' : 'Aún no tienes videos guardados'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {isFiltered ? 'Prueba con otros filtros' : 'Pega una URL de TikTok o Instagram arriba para empezar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={handleMutate}
                onUpdate={handleMutate}
                onRetry={handleMutate}
                onTagClick={(tag) => {
                  if (!activeTags.includes(tag)) setActiveTags((prev) => [...prev, tag])
                }}
                onViewTranscript={setSelectedVideo}
              />
            ))}
          </div>
        )}
      </div>

      <TranscriptModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
