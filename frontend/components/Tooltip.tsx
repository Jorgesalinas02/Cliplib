'use client'

import { useState, useRef } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    timer.current = setTimeout(() => setVisible(true), 120)
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <div
          className={`
            pointer-events-none absolute z-50 left-1/2 -translate-x-1/2
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            animate-in fade-in-0 zoom-in-95 duration-100
          `}
        >
          {/* Bubble */}
          <div className="bg-brand-dark text-white text-xs font-medium px-2.5 py-1.5 rounded-badge whitespace-nowrap shadow-lg">
            {text}
          </div>
          {/* Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0
            ${position === 'top'
              ? 'top-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-brand-dark'
              : 'bottom-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-brand-dark'
            }`}
          />
        </div>
      )}
    </div>
  )
}
