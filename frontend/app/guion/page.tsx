'use client'

import { useState } from 'react'
import { Video } from '@/lib/api'
import { useVideos } from '@/hooks/useVideos'
import VideoCard from '@/components/VideoCard'
import TranscriptModal from '@/components/TranscriptModal'
import Nav from '@/components/Nav'

export default function GuionEscrito() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const { videos, isLoading, mutate } = useVideos({ scripted: true })

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Logo + Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Cliplib</h1>
            <span className="w-2 h-2 rounded-full bg-brand-olive" />
          </div>
          <Nav active="guion" />
        </div>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Guión escrito</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {isLoading ? '...' : `${videos.length} ${videos.length === 1 ? 'video con guión' : 'videos con guión'}`}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/60 border border-black/5 rounded-card p-4 h-52 animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-black/8 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <p className="text-brand-dark font-medium">No tienes guiones escritos aún</p>
            <p className="text-gray-400 text-sm mt-1">
              Toca el botón <span className="font-medium">"Guión"</span> en cualquier video para marcarlo aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={() => mutate()}
                onUpdate={() => mutate()}
                onRetry={() => mutate()}
                onTagClick={() => {}}
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
