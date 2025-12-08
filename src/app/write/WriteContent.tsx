'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { MoonPhase, DiaryEntry } from '@/types/diary'
import { diaryService, uploadFile, deleteFile } from '@/lib/supabase'
import { dateUtils } from '@/lib/dateUtils'
import MoodSelector from '@/components/MoodSelector'
import dayjs from 'dayjs'

export default function WriteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryIdParam = searchParams.get('id')
  const dateParam = searchParams.get('date')
  const today = dateUtils.getTodayString()
  const initialDate = dateParam || today
  const isEditMode = !!entryIdParam

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedMood, setSelectedMood] = useState<MoonPhase | null>(null)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(dayjs(initialDate))

  // 날짜가 변경되면 초기화
  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam)
    } else if (!isEditMode) {
      setSelectedDate(today)
    }
  }, [dateParam, today, isEditMode])

  useEffect(() => {
    // 수정 모드일 때만 기존 일기 로드 (id 기반)
    if (isEditMode && entryIdParam) {
      diaryService.getEntryById(entryIdParam).then((entry) => {
        if (entry) {
          setExistingEntry(entry)
          setSelectedMood(entry.mood)
          setNote(entry.note || '')
          setMediaUrls(entry.media_urls || [])
        } else {
          // 수정 모드인데 일기가 없으면 홈으로 리다이렉트
          router.push('/')
        }
        setIsInitialized(true)
      })
    } else {
      // 새 작성 모드: 항상 빈 상태로 시작 (여러 개 작성 가능)
      setExistingEntry(null)
      setSelectedMood('full') // 보름달을 기본값으로 설정
      setNote('')
      setMediaUrls([])
      setIsInitialized(true)
    }
  }, [entryIdParam, isEditMode, router])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingMedia(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 파일 타입 검증
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
          alert(`${file.name}은(는) 지원하지 않는 파일 형식입니다. 이미지나 동영상만 업로드 가능합니다.`)
          return null
        }

        // 파일 크기 제한 (100MB)
        if (file.size > 100 * 1024 * 1024) {
          alert(`${file.name}의 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.`)
          return null
        }

        try {
          return await uploadFile(file, existingEntry?.id)
        } catch (error) {
          if (error instanceof Error) {
            alert(error.message)
          } else {
            alert('파일 업로드 중 오류가 발생했습니다.')
          }
          return null
        }
      })

      const uploadedUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null)

      setMediaUrls((prev) => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading files:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('파일 업로드 중 오류가 발생했습니다.')
      }
    } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveMedia = async (index: number) => {
    const urlToRemove = mediaUrls[index]

    // 기존 파일 삭제 (임시 파일이 아닌 경우)
    if (urlToRemove && !urlToRemove.includes('/temp/')) {
      await deleteFile(urlToRemove)
    }

    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!selectedMood) {
      alert('감정을 선택해주세요.')
      return
    }

    setIsLoading(true)

    try {
      if (isEditMode && existingEntry?.id) {
        // 수정 모드: 기존 일기 업데이트
        const result = await diaryService.updateEntry(existingEntry.id, {
          mood: selectedMood,
          note: note.trim() || undefined,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined
        })

        if (result) {
          router.push('/')
        } else {
          alert('수정 중 오류가 발생했습니다.')
          setIsLoading(false)
        }
      } else {
        // 새 작성 모드: 항상 새로 생성
        const entry: DiaryEntry = {
          date: selectedDate,
          mood: selectedMood,
          note: note.trim() || undefined,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined
        }

        const result = await diaryService.insertEntry(entry)

        if (result) {
          router.push('/')
        } else {
          alert('저장 중 오류가 발생했습니다.')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('저장 중 오류가 발생했습니다.')
      }
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="relative sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          {!isEditMode && (
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex-1 text-center text-lg font-semibold text-[var(--text-primary)] hover:opacity-70 transition-opacity"
            >
              {dateUtils.formatDateKorean(selectedDate)}
            </button>
          )}
          {isEditMode && (
            <h2 className="flex-1 text-center text-lg font-semibold text-[var(--text-primary)]">
              {dateUtils.formatDateKorean(existingEntry?.date || selectedDate)}
            </h2>
          )}
          {/* 아이콘과 제목의 균형을 맞추기 위한 빈 공간 */}
          <div className="w-9" />
        </div>

        {/* 캘린더 드롭다운 */}
        {!isEditMode && showCalendar && (
          <div className="absolute top-full left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth((prev) => prev.subtract(1, 'month'))}
                  className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {calendarMonth.format('YYYY년 M월')}
                </span>
                <button
                  onClick={() => setCalendarMonth((prev) => prev.add(1, 'month'))}
                  className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
                </button>
              </div>
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => {
                    const today = dayjs()
                    const todayStr = today.format('YYYY-MM-DD')
                    setCalendarMonth(today)
                    setSelectedDate(todayStr)
                    setShowCalendar(false)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--accent-yellow)] hover:text-black rounded-lg transition-colors"
                >
                  오늘
                </button>
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-xs text-[var(--text-secondary)] py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDayOfMonth = calendarMonth.startOf('month')
                  const firstDayOfWeek = firstDayOfMonth.day()
                  const daysInMonth = calendarMonth.daysInMonth()
                  const days: (number | null)[] = []

                  // 첫 주의 빈 공간
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    days.push(null)
                  }

                  // 날짜 채우기
                  for (let day = 1; day <= daysInMonth; day++) {
                    days.push(day)
                  }

                  return days.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const date = calendarMonth.date(day)
                    const dateStr = date.format('YYYY-MM-DD')
                    const isToday = date.isSame(dayjs(), 'day')
                    const isSelected = dateStr === selectedDate
                    const isFuture = date.isAfter(dayjs(), 'day')

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          if (!isFuture) {
                            setSelectedDate(dateStr)
                            setShowCalendar(false)
                          }
                        }}
                        disabled={isFuture}
                        className={`aspect-square rounded text-sm transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-yellow)] text-black font-semibold'
                            : isToday
                            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold'
                            : isFuture
                            ? 'text-[var(--text-secondary)] opacity-30 cursor-not-allowed'
                            : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex flex-col h-[calc(100vh-57px)] px-4 py-4 pb-24">
        <div className="ig-card p-4 flex flex-col flex-1 min-h-0">
          {!isInitialized ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">로딩 중...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">감정 상태</label>
                  <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-[var(--text-primary)]">기록</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingMedia}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="파일 첨부"
                      title="이미지 또는 동영상 업로드"
                    >
                      {uploadingMedia ? (
                        <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="오늘 하루를 간단히 기록해보세요..."
                    className="w-full pl-4 pr-4 py-3 border-l border-[var(--accent-yellow)] bg-transparent focus:outline-none resize-none text-sm text-[var(--text-primary)] custom-scrollbar"
                    rows={8}
                  />

                  {/* 업로드된 미디어 미리보기 */}
                  {mediaUrls.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        {mediaUrls.map((url, mediaIndex) => {
                          const isVideo =
                            url.includes('.mp4') ||
                            url.includes('.mov') ||
                            url.includes('.webm') ||
                            url.includes('video')
                          return (
                            <div
                              key={mediaIndex}
                              className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)] group"
                            >
                              {isVideo ? (
                                <video src={url} className="w-full h-full object-cover" controls />
                              ) : (
                                <img
                                  src={url}
                                  alt={`미디어 ${mediaIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <button
                                onClick={() => handleRemoveMedia(mediaIndex)}
                                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="삭제"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isLoading || !selectedMood || (!note.trim() && mediaUrls.length === 0)}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm ig-button disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? '저장 중...' : isEditMode ? '수정' : '저장'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
