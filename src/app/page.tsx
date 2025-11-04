'use client'

import { useState } from 'react'
import DiaryFeed from '@/components/DiaryFeed'
import DateFilter from '@/components/DateFilter'
import BottomNavigation from '@/components/BottomNavigation'

export default function HomePage() {
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl moon-diary-title text-[var(--text-primary)]">
            <span className="text-base mr-1.5">🌙</span> Moon Diary
          </h1>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        <DateFilter onFilterChange={setDateFilter} />
        <DiaryFeed dateFilter={dateFilter} />
      </main>

      <BottomNavigation />
    </>
  )
}
