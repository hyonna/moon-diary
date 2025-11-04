'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl moon-diary-title text-[var(--text-primary)] hover:opacity-70 transition-opacity"
        >
          <span className="text-base mr-1.5">🌙</span> Moon Diary
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            홈
          </Link>
          <Link
            href="/diary"
            className={`text-sm font-medium transition-colors ${
              pathname === '/diary'
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            일기
          </Link>
        </div>
      </div>
    </nav>
  )
}
