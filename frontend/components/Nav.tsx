'use client'

import Link from 'next/link'

interface NavProps {
  active: 'biblioteca' | 'grabados'
}

export default function Nav({ active }: NavProps) {
  return (
    <div className="flex items-center gap-1 bg-white border border-black/8 rounded-badge p-1">
      <Link
        href="/"
        className={`px-4 py-1.5 rounded-badge text-sm font-medium transition-colors ${
          active === 'biblioteca'
            ? 'bg-brand-dark text-white'
            : 'text-gray-500 hover:text-brand-dark'
        }`}
      >
        Biblioteca
      </Link>
      <Link
        href="/grabados"
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-badge text-sm font-medium transition-colors ${
          active === 'grabados'
            ? 'bg-brand-dark text-white'
            : 'text-gray-500 hover:text-brand-dark'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={active === 'grabados' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
        Grabados
      </Link>
    </div>
  )
}
