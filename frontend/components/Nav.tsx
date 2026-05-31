'use client'

import Link from 'next/link'

interface NavProps {
  active: 'biblioteca' | 'grabados' | 'guion'
}

const tabs = [
  { id: 'biblioteca', href: '/',        label: 'Biblioteca',    icon: null },
  { id: 'grabados',   href: '/grabados', label: 'Grabados',
    icon: (active: boolean) => (
      <svg className="w-3.5 h-3.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
      </svg>
    )
  },
  { id: 'guion', href: '/guion', label: 'Guión escrito',
    icon: (active: boolean) => (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
    )
  },
] as const

export default function Nav({ active }: NavProps) {
  return (
    <div className="flex items-center gap-1 bg-white border border-black/8 rounded-badge p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-badge text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-dark text-white'
                : 'text-gray-500 hover:text-brand-dark'
            }`}
          >
            {tab.icon && tab.icon(isActive)}
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
