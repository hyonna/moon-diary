'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { DiaryEntry, MOOD_MAPPINGS } from '@/types/diary'
import { diaryService } from '@/lib/supabase'
import { dateUtils } from '@/lib/dateUtils'

interface DiaryFeedProps {
  dateFilter?: string | null
}

export default function DiaryFeed({ dateFilter }: DiaryFeedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const pageRef = useRef(0)
  const ITEMS_PER_PAGE = 10

  const loadEntries = useCallback(
    async (page: number, filter?: string | null) => {
      if (loading || !session?.user?.id) return
      setLoading(true)

      try {
        const allEntries = await diaryService.getAllEntries(session.user.id)

        // 날짜 필터 적용 (월별 필터링)
        let filteredEntries = allEntries
        if (filter) {
          const filterDate = dateUtils.parseDate(filter)
          filteredEntries = allEntries.filter((entry) => {
            const entryDate = dateUtils.parseDate(entry.date)
            return entryDate.year() === filterDate.year() && entryDate.month() === filterDate.month()
          })
        }

        // 정렬: 날짜 기준 최신순 (날짜가 같으면 created_at 기준 최신순)
        filteredEntries.sort((a, b) => {
          const dateA = dateUtils.parseDate(a.date)
          const dateB = dateUtils.parseDate(b.date)

          const dateDiff = dateB.diff(dateA, 'day')
          if (dateDiff !== 0) {
            return dateDiff // 날짜 기준 내림차순 (최신 날짜 먼저)
          }

          // 같은 날짜면 created_at 기준 내림차순
          if (a.created_at && b.created_at) {
            return dateUtils.parseDate(b.created_at).diff(dateUtils.parseDate(a.created_at), 'millisecond')
          }
          return 0
        })

        // 페이지네이션
        const startIndex = page * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const pageEntries = filteredEntries.slice(startIndex, endIndex)

        if (page === 0) {
          setEntries(pageEntries)
        } else {
          setEntries((prev) => [...prev, ...pageEntries])
        }

        setHasMore(endIndex < filteredEntries.length)
      } catch (error) {
        console.error('Failed to load entries:', error)
      } finally {
        setLoading(false)
      }
    },
    [loading, session]
  )

  useEffect(() => {
    pageRef.current = 0
    loadEntries(0, dateFilter)
  }, [dateFilter])

  const lastEntryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          pageRef.current += 1
          loadEntries(pageRef.current, dateFilter)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore, dateFilter, loadEntries]
  )

  const handleMenuToggle = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === entryId ? null : entryId)
  }

  const handleEdit = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    router.push(`/write?id=${entryId}`)
  }

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    if (!confirm('정말로 이 일기를 삭제하시겠습니까?')) {
      return
    }

    if (!session?.user?.id) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const success = await diaryService.deleteEntry(entryId, session.user.id)
      if (success) {
        // 목록 새로고침
        pageRef.current = 0
        loadEntries(0, dateFilter)
      } else {
        alert('삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // 메뉴 버튼이나 드롭다운 메뉴 내부 클릭은 무시
      if (!target.closest('.menu-container')) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  if (entries.length === 0 && !loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-[var(--text-secondary)] text-sm">아직 기록된 일기가 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1
        const mapping = MOOD_MAPPINGS[entry.mood]

        return (
          <div
            key={entry.id || `entry-${entry.date}-${index}`}
            ref={isLast && hasMore ? lastEntryRef : null}
            className={`pb-4 -mx-4 px-4 py-3 ${
              isLast ? 'mb-0' : 'mb-4 border-b border-[var(--border-color)]'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* 달 이모지 - 왼쪽 */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl border border-[var(--border-color)]">
                  {mapping.emoji}
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="flex-1 min-w-0">
                {/* 작성일 - 내용 위에 배치 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 font-medium">
                    {dateUtils.parseDate(entry.date).format('YYYY-MM-DD')}
                  </span>
                  {/* 도트 메뉴 */}
                  <div className="relative menu-container">
                    <button
                      onClick={(e) => entry.id && handleMenuToggle(e, entry.id)}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                      title="메뉴"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    {/* 드롭다운 메뉴 */}
                    {openMenuId === entry.id && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => entry.id && handleEdit(e, entry.id)}
                          className="w-full px-3 py-1.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg whitespace-nowrap"
                        >
                          <Edit className="w-4 h-4" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={(e) => entry.id && handleDelete(e, entry.id)}
                          className="w-full px-3 py-1.5 text-left text-sm text-red-700 hover:bg-[var(--bg-secondary)] flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg whitespace-nowrap"
                        >
                          <Trash2 className="w-4 h-4 text-red-700" />
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 본문 */}
                {entry.note && (
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words leading-relaxed">
                    {entry.note}
                  </p>
                )}

                {/* 미디어 (이미지/동영상) */}
                {entry.media_urls && entry.media_urls.length > 0 && (
                  <div className="mt-3">
                    {entry.media_urls.length === 1 ? (
                      // 단일 이미지: 전체 너비
                      <div className="relative w-full rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                        {(() => {
                          const isVideo =
                            entry.media_urls[0].includes('.mp4') ||
                            entry.media_urls[0].includes('.mov') ||
                            entry.media_urls[0].includes('.webm') ||
                            entry.media_urls[0].includes('video')
                          return isVideo ? (
                            <video
                              src={entry.media_urls[0]}
                              className="w-full h-auto object-cover rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={entry.media_urls[0]}
                              alt="미디어"
                              className="w-full h-auto object-cover rounded-lg"
                              loading="lazy"
                            />
                          )
                        })()}
                      </div>
                    ) : (
                      // 여러 이미지: 가로 스크롤
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
                        {entry.media_urls.map((url, mediaIndex) => {
                          const isVideo =
                            url.includes('.mp4') ||
                            url.includes('.mov') ||
                            url.includes('.webm') ||
                            url.includes('video')
                          return (
                            <div
                              key={mediaIndex}
                              className="relative flex-shrink-0 w-[200px] h-[200px] bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)]"
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
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="py-8 text-center">
          <p className="text-[var(--text-secondary)] text-sm">로딩 중...</p>
        </div>
      )}
    </div>
  )
}
