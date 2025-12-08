'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'
import { DiaryEntry, MOOD_MAPPINGS } from '@/types/diary'
import { diaryService } from '@/lib/supabase'
import { dateUtils } from '@/lib/dateUtils'
import dayjs from 'dayjs'

interface RandomDiaryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RandomDiaryModal({ isOpen, onClose }: RandomDiaryModalProps) {
  const { data: session } = useSession()
  const [randomEntry, setRandomEntry] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // body 스크롤 방지
      document.body.style.overflow = 'hidden'
    } else {
      // body 스크롤 복원
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 모달이 열릴 때 랜덤 일기 로드
  useEffect(() => {
    if (isOpen) {
      loadRandomEntry()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const loadRandomEntry = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const allEntries = await diaryService.getAllEntries(session.user.id)
      const today = dateUtils.getTodayString()

      // 오늘 날짜를 제외한 과거 일기들만 필터링
      const pastEntries = allEntries.filter((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        const todayDate = dateUtils.parseDate(today)
        return entryDate.isBefore(todayDate, 'day')
      })

      if (pastEntries.length === 0) {
        setRandomEntry(null)
        setLoading(false)
        return
      }

      // 랜덤으로 하나 선택
      const randomIndex = Math.floor(Math.random() * pastEntries.length)
      setRandomEntry(pastEntries[randomIndex])
    } catch (error) {
      console.error('Failed to load random entry:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const mapping = randomEntry ? MOOD_MAPPINGS[randomEntry.mood] : null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0 bg-[var(--bg-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">과거의 일기</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRandomEntry}
              className="px-3 py-1.5 text-xs bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              다른 일기
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* 내용 - 스크롤 가능 */}
        <div className="overflow-y-auto flex-1 modal-scroll">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[var(--text-secondary)] text-sm">로딩 중...</p>
            </div>
          ) : randomEntry ? (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                {/* 달 이모지 */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl border border-[var(--border-color)]">
                    {mapping?.emoji}
                  </div>
                </div>

                {/* 날짜 및 감정 */}
                <div className="flex-1">
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    {dateUtils.parseDate(randomEntry.date).format('YYYY년 M월 D일')}
                    {randomEntry.created_at && (
                      <span className="ml-2">
                        {dateUtils.formatTime(randomEntry.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="text-base font-semibold text-[var(--text-primary)]">
                    {mapping?.name}
                  </div>
                </div>
              </div>

              {/* 본문 */}
              {randomEntry.note && (
                <div className="mb-4">
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words leading-relaxed">
                    {randomEntry.note}
                  </p>
                </div>
              )}

              {/* 미디어 */}
              {randomEntry.media_urls && randomEntry.media_urls.length > 0 && (
                <div className="mt-4">
                  {randomEntry.media_urls.length === 1 ? (
                    <div className="relative w-full rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                      {(() => {
                        const isVideo =
                          randomEntry.media_urls![0].includes('.mp4') ||
                          randomEntry.media_urls![0].includes('.mov') ||
                          randomEntry.media_urls![0].includes('.webm') ||
                          randomEntry.media_urls![0].includes('video')
                        return isVideo ? (
                          <video
                            src={randomEntry.media_urls![0]}
                            className="w-full h-auto object-cover rounded-lg max-h-64"
                            controls
                          />
                        ) : (
                          <img
                            src={randomEntry.media_urls![0]}
                            alt="미디어"
                            className="w-full h-auto object-cover rounded-lg max-h-64"
                            loading="lazy"
                          />
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {randomEntry.media_urls.map((url, mediaIndex) => {
                        const isVideo =
                          url.includes('.mp4') ||
                          url.includes('.mov') ||
                          url.includes('.webm') ||
                          url.includes('video')
                        return (
                          <div
                            key={mediaIndex}
                            className="relative w-full aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)]"
                          >
                            {isVideo ? (
                              <video src={url} className="w-full h-full object-cover" controls />
                            ) : (
                              <img
                                src={url}
                                alt={`미디어 ${mediaIndex + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-[var(--text-secondary)] text-sm">과거 일기가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

