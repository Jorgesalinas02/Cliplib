'use client'

import { useState, useEffect } from 'react'

interface SearchBarProps {
  onSearch: (q: string) => void
  value: string
}

export default function SearchBar({ onSearch, value }: SearchBarProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(local)
    }, 300)
    return () => clearTimeout(timer)
  }, [local, onSearch])

  useEffect(() => {
    if (value !== local) setLocal(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Buscar videos..."
        className="w-full bg-white border border-black/10 rounded-card pl-9 pr-4 py-2.5 text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-blue/60 transition-colors text-sm"
      />
      {local && (
        <button
          onClick={() => setLocal('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}
