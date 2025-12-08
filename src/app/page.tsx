'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Shuffle } from 'lucide-react'
import { diaryService } from '@/lib/supabase'
import DiaryFeed from '@/components/DiaryFeed'
import DateFilter from '@/components/DateFilter'
import BottomNavigation from '@/components/BottomNavigation'
import RandomDiaryModal from '@/components/RandomDiaryModal'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false)
  const [hasEntries, setHasEntries] = useState<boolean>(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // 작성된 일기 유무 확인
  useEffect(() => {
    if (session?.user?.id) {
      diaryService.getAllEntries(session.user.id).then((entries) => {
        setHasEntries(entries.length > 0)
      })
    }
  }, [session])

  // 로그인 중이거나 로그인되지 않은 경우 로딩 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl moon-diary-title text-[var(--text-primary)]">
            <span className="text-base mr-1.5">🌙</span> Moon Diary
          </h1>
        </div>
      </header>

      <main className="px-4 py-4 pb-20">
        <div className="mb-4 flex gap-3 items-center">
          <div className="flex-1">
            <DateFilter onFilterChange={setDateFilter} />
          </div>
          <button
            onClick={() => hasEntries && setIsRandomModalOpen(true)}
            disabled={!hasEntries}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-opacity shadow-sm ${
              hasEntries
                ? 'bg-[var(--accent-yellow)] text-black hover:opacity-90'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
            }`}
            title={hasEntries ? '과거 일기 랜덤 보기' : '일기가 없어요'}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
        <DiaryFeed dateFilter={dateFilter} />
      </main>

      <RandomDiaryModal isOpen={isRandomModalOpen} onClose={() => setIsRandomModalOpen(false)} />

      <BottomNavigation />
    </>
  )
}
