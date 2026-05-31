'use client'

import useSWR from 'swr'
import { getTags, TagCount } from '@/lib/api'

interface FilterChipsProps {
  activeTags: string[]
  onTagToggle: (tag: string) => void
  onClearAll: () => void
}

export default function FilterChips({ activeTags, onTagToggle, onClearAll }: FilterChipsProps) {
  const { data: tags } = useSWR<TagCount[]>('tags', getTags, {
    revalidateOnFocus: false,
  })

  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {activeTags.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-xs text-gray-400 hover:text-brand-dark transition-colors px-2 py-1"
        >
          Limpiar filtros
        </button>
      )}
      {tags.map(({ tag, count }) => {
        const active = activeTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-xs font-medium transition-colors ${
              active
                ? 'bg-brand-dark text-brand-yellow border border-brand-dark'
                : 'bg-white text-gray-500 hover:text-brand-dark border border-black/10 hover:border-black/20'
            }`}
          >
            {tag}
            <span className={`${active ? 'text-brand-yellow/70' : 'text-gray-500'}`}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
