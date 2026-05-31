'use client'

import { CATEGORIES } from '@/lib/api'

// Color mapping for each category
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  'Deportes':            { bg: 'bg-brand-blue/20',   text: 'text-blue-700',   activeBg: 'bg-brand-blue',   activeText: 'text-brand-dark' },
  'Marketing':           { bg: 'bg-brand-pink/20',   text: 'text-pink-700',   activeBg: 'bg-brand-pink',   activeText: 'text-brand-dark' },
  'Tecnología':          { bg: 'bg-brand-purple/20', text: 'text-purple-700', activeBg: 'bg-brand-purple', activeText: 'text-brand-dark' },
  'Crecimiento personal':{ bg: 'bg-brand-olive/20',  text: 'text-green-700',  activeBg: 'bg-brand-olive',  activeText: 'text-brand-dark' },
  'Negocios':            { bg: 'bg-brand-yellow/20', text: 'text-yellow-700', activeBg: 'bg-brand-yellow', activeText: 'text-brand-dark' },
}

interface CategoryFilterProps {
  activeCategory: string | undefined
  onCategoryChange: (category: string | undefined) => void
}

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => onCategoryChange(undefined)}
        className={`px-3 py-1 rounded-badge text-xs font-medium transition-colors border ${
          !activeCategory
            ? 'bg-brand-dark text-white border-brand-dark'
            : 'bg-white text-gray-500 border-black/10 hover:border-black/20 hover:text-brand-dark'
        }`}
      >
        Todas
      </button>
      {CATEGORIES.map((cat) => {
        const colors = CATEGORY_COLORS[cat]
        const isActive = activeCategory === cat
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(isActive ? undefined : cat)}
            className={`px-3 py-1 rounded-badge text-xs font-medium transition-colors border ${
              isActive
                ? `${colors.activeBg} ${colors.activeText} border-transparent`
                : `bg-white ${colors.text} border-black/10 hover:border-black/20`
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
