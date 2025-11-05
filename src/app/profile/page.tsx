'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, LogOut, Edit2, Check, X } from 'lucide-react'
import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary'
import { diaryService } from '@/lib/supabase'
import { dateUtils } from '@/lib/dateUtils'
import { analyzeStats } from '@/lib/analyzeStats'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import BottomNavigation from '@/components/BottomNavigation'
import CalendarView from '@/components/CalendarView'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const Moon3D = dynamic(() => import('@/components/Moon3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
      <p className="text-sm text-[var(--text-secondary)]">로딩 중...</p>
    </div>
  )
})

type PeriodType = 'month' | 'year' | 'all'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut, updateNickname } = useAuth()
  const { showToast } = useToast()
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [editedNickname, setEditedNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const now = dayjs()
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedYear, setSelectedYear] = useState(now.year())
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [allEntries, setAllEntries] = useState<DiaryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([])
  const [moodCounts, setMoodCounts] = useState<Record<MoonPhase, number>>({
    new: 0,
    waxing: 0,
    full: 0,
    waning: 0
  })
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; count: number }>>([])
  const [dailyMoods, setDailyMoods] = useState<
    Array<{ date: string; mood: MoonPhase; dateLabel: string; entryId?: string; index: number }>
  >([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [statAnalysis, setStatAnalysis] = useState<{
    summary: string
    insights: string[]
  } | null>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleStartEditNickname = () => {
    if (profile) {
      setEditedNickname(profile.nickname)
      setIsEditingNickname(true)
      setNicknameError('')
    }
  }

  const handleCancelEditNickname = () => {
    setIsEditingNickname(false)
    setEditedNickname('')
    setNicknameError('')
  }

  const handleSaveNickname = async () => {
    setNicknameError('')

    if (!editedNickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.')
      return
    }

    if (editedNickname.trim().length > 20) {
      setNicknameError('닉네임은 최대 20자까지 입력 가능합니다.')
      return
    }

    if (editedNickname.trim() === profile?.nickname) {
      setIsEditingNickname(false)
      return
    }

    setIsUpdatingNickname(true)
    const { error } = await updateNickname(editedNickname.trim())

    if (error) {
      setNicknameError(error.message || '닉네임 변경에 실패했습니다.')
      setIsUpdatingNickname(false)
    } else {
      setIsEditingNickname(false)
      setIsUpdatingNickname(false)
      showToast('닉네임이 변경되었습니다.', 'success')
    }
  }

  // COLORS를 컴포넌트 상단에 정의
  const COLORS = {
    new: '#fbbf24', // 옐로우 계열 - 연한 노란색
    waxing: '#fcd34d', // 옐로우 계열 - 중간 노란색
    full: '#ffd700', // 옐로우 계열 - 골드
    waning: '#facc15' // 옐로우 계열 - 진한 노란색
  }

  function getColorForPhase(phase: MoonPhase): string {
    return COLORS[phase]
  }

  // 모든 엔트리 로드
  useEffect(() => {
    diaryService.getAllEntries().then((entries) => {
      setAllEntries(entries)
    })
  }, [])

  // 기간에 따른 필터링
  useEffect(() => {
    let filtered: DiaryEntry[] = []

    if (periodType === 'all') {
      filtered = allEntries
    } else if (periodType === 'year') {
      filtered = allEntries.filter((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        return entryDate.year() === selectedYear
      })
    } else if (periodType === 'month') {
      filtered = allEntries.filter((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        return entryDate.year() === selectedYear && entryDate.month() === selectedMonth - 1
      })
    }

    setFilteredEntries(filtered)
    setTotalEntries(filtered.length)

    // 감정별 통계
    const counts: Record<MoonPhase, number> = {
      new: 0,
      waxing: 0,
      full: 0,
      waning: 0
    }

    filtered.forEach((entry) => {
      counts[entry.mood]++
    })

    setMoodCounts(counts)

    // 기간별 활동 통계
    const periodMap = new Map<string, number>()
    let startDate: dayjs.Dayjs
    let endDate: dayjs.Dayjs

    if (periodType === 'all') {
      // 전체 기간: 최근 12개월
      startDate = dayjs().subtract(12, 'month')
      endDate = dayjs()
      filtered.forEach((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        if (entryDate.isAfter(startDate.subtract(1, 'day')) && entryDate.isBefore(endDate.add(1, 'day'))) {
          const monthKey = entryDate.format('YYYY년 M월')
          periodMap.set(monthKey, (periodMap.get(monthKey) || 0) + 1)
        }
      })
    } else if (periodType === 'year') {
      // 선택된 년도: 해당 년도의 모든 월
      startDate = dayjs(`${selectedYear}-01-01`)
      endDate = dayjs(`${selectedYear}-12-31`)
      filtered.forEach((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        if (entryDate.isAfter(startDate.subtract(1, 'day')) && entryDate.isBefore(endDate.add(1, 'day'))) {
          const monthKey = entryDate.format('YYYY년 M월')
          periodMap.set(monthKey, (periodMap.get(monthKey) || 0) + 1)
        }
      })
    } else {
      // 선택된 월: 일별 활동
      startDate = dayjs(`${selectedYear}-${selectedMonth}-01`)
      endDate = dayjs(`${selectedYear}-${selectedMonth}-01`).endOf('month')
      filtered.forEach((entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        if (entryDate.isAfter(startDate.subtract(1, 'day')) && entryDate.isBefore(endDate.add(1, 'day'))) {
          // 정렬을 위해 날짜를 키로 사용하고, 표시용 포맷도 함께 저장
          const dayKey = entryDate.format('YYYY-MM-DD')
          periodMap.set(dayKey, (periodMap.get(dayKey) || 0) + 1)
        }
      })
    }

    const periodData = Array.from(periodMap.entries())
      .map(([period, count]) => {
        // 월별일 때는 "YYYY-MM-DD"를 "M월 D일"로 변환
        if (periodType === 'month') {
          const date = dayjs(period)
          if (date.isValid()) {
            return { month: date.format('M월 D일'), count, sortKey: period }
          }
        }
        // 년/전체일 때는 "YYYY년 M월" 형식 유지
        return { month: period, count, sortKey: period }
      })
      .sort((a, b) => {
        // sortKey로 정렬 (날짜 형식)
        try {
          const dateA = dayjs(a.sortKey)
          const dateB = dayjs(b.sortKey)
          if (dateA.isValid() && dateB.isValid()) {
            return dateA.diff(dateB)
          }
          return a.sortKey.localeCompare(b.sortKey)
        } catch {
          return a.sortKey.localeCompare(b.sortKey)
        }
      })
      .map(({ month, count }) => ({ month, count })) // sortKey 제거

    setMonthlyData(periodData)

    // 월별 모드일 때 날짜별 감정 데이터 생성
    if (periodType === 'month') {
      const dailyMoodData = filtered
        .map((entry, index) => {
          const entryDate = dateUtils.parseDate(entry.date)
          return {
            date: entry.date,
            mood: entry.mood,
            dateLabel: entryDate.format('M월 D일'),
            sortKey: entry.date,
            entryId: entry.id,
            index
          }
        })
        .sort((a, b) => {
          const dateDiff = dayjs(a.sortKey).diff(dayjs(b.sortKey))
          if (dateDiff !== 0) return dateDiff
          // 같은 날짜면 인덱스로 정렬
          return a.index - b.index
        })
        .map(({ date, mood, dateLabel, entryId, index }) => ({
          date,
          mood,
          dateLabel,
          entryId,
          index
        }))
      setDailyMoods(dailyMoodData)
    } else {
      setDailyMoods([])
    }

    // AI 통계 분석
    const analysis = analyzeStats(filtered)
    setStatAnalysis({
      summary: analysis.summary,
      insights: analysis.insights
    })
  }, [allEntries, periodType, selectedYear, selectedMonth])

  const chartData = Object.entries(MOOD_MAPPINGS).map(([phase, mapping]) => ({
    name: mapping.name,
    value: moodCounts[phase as MoonPhase],
    emoji: mapping.emoji,
    fill: getColorForPhase(phase as MoonPhase)
  }))

  const handlePrevPeriod = () => {
    if (periodType === 'month') {
      if (selectedMonth === 1) {
        setSelectedYear(selectedYear - 1)
        setSelectedMonth(12)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else if (periodType === 'year') {
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextPeriod = () => {
    if (periodType === 'month') {
      if (selectedMonth === 12) {
        setSelectedYear(selectedYear + 1)
        setSelectedMonth(1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    } else if (periodType === 'year') {
      setSelectedYear(selectedYear + 1)
    }
  }

  const handleYearClick = () => {
    setShowYearPicker(!showYearPicker)
    setShowMonthPicker(false)
  }

  const handleMonthClick = () => {
    setShowMonthPicker(!showMonthPicker)
    setShowYearPicker(false)
  }

  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
    setShowYearPicker(false)
  }

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month + 1)
    setShowMonthPicker(false)
  }

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type)
    setShowYearPicker(false)
    setShowMonthPicker(false)
    if (type === 'all') {
      // 전체 기간 선택 시 현재 년/월은 유지하되 표시만 안 함
    } else if (type === 'year') {
      // 년도 선택 시 현재 년도로 설정
    } else {
      // 월 선택 시 현재 월로 설정
      const now = dayjs()
      setSelectedYear(now.year())
      setSelectedMonth(now.month() + 1)
    }
  }

  // 연도 리스트 생성 (현재 연도 기준 ±5년)
  const currentYear = dayjs().year()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  // 월 리스트
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  // 현재 표시할 날짜 문자열
  const getPeriodLabel = () => {
    if (periodType === 'all') {
      return '전체 기록'
    } else if (periodType === 'year') {
      return `${selectedYear}년`
    } else {
      return `${selectedYear}년 ${selectedMonth}월`
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.period-picker')) {
        setShowYearPicker(false)
        setShowMonthPicker(false)
      }
    }
    if (showYearPicker || showMonthPicker) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showYearPicker, showMonthPicker])

  // 기록률 계산
  const getRecordRate = () => {
    if (periodType === 'month') {
      const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth()
      return totalEntries > 0 ? Math.round((totalEntries / daysInMonth) * 100) : 0
    } else if (periodType === 'year') {
      // 윤년 계산: 4로 나누어떨어지고 100으로 나누어떨어지지 않거나, 400으로 나누어떨어지는 경우
      const isLeapYear = (year: number) => {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      }
      const daysInYear = isLeapYear(selectedYear) ? 366 : 365
      return totalEntries > 0 ? Math.round((totalEntries / daysInYear) * 100) : 0
    } else {
      // 전체 기간: 전체 기록일 / 전체 일수
      if (allEntries.length === 0) return 0
      const firstEntry = allEntries.reduce((earliest, entry) => {
        const entryDate = dateUtils.parseDate(entry.date)
        const earliestDate = dateUtils.parseDate(earliest.date)
        return entryDate.isBefore(earliestDate) ? entry : earliest
      })
      const firstDate = dateUtils.parseDate(firstEntry.date)
      const daysSinceFirst = dayjs().diff(firstDate, 'day')
      return daysSinceFirst > 0 ? Math.round((totalEntries / daysSinceFirst) * 100) : 0
    }
  }

  // 로그인하지 않은 경우
  if (!authLoading && !user) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
          <div className="flex items-center justify-center px-4 py-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">내 정보</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-24">
          <div className="max-w-md mx-auto text-center">
            <p className="text-[var(--text-secondary)] mb-4">로그인이 필요합니다.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity font-semibold"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <BottomNavigation />
      </>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">내 정보</h1>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* 사용자 정보 */}
        {profile && (
          <div className="mb-6 p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">닉네임</p>
                {isEditingNickname ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedNickname}
                        onChange={(e) => {
                          setEditedNickname(e.target.value)
                          setNicknameError('')
                        }}
                        maxLength={20}
                        disabled={isUpdatingNickname}
                        className={`flex-1 px-3 py-2 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-base font-semibold ${
                          nicknameError ? 'border-red-500' : 'border-[var(--border-color)]'
                        }`}
                        placeholder="닉네임을 입력하세요"
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={isUpdatingNickname}
                        className="p-2 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 active:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="저장"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEditNickname}
                        disabled={isUpdatingNickname}
                        className="p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] active:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="취소"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {nicknameError && <p className="text-xs text-red-500">{nicknameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{profile.nickname}</p>
                    <button
                      onClick={handleStartEditNickname}
                      className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg transition-all"
                      title="닉네임 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">이메일</p>
                <p className="text-sm text-[var(--text-primary)] break-all">{profile.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* 기간 선택 UI */}
        <div className="mb-4">
          {/* 기간 타입 선택 버튼 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handlePeriodTypeChange('month')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodType === 'month'
                  ? 'bg-[var(--accent-yellow)] text-black'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              월별
            </button>
            <button
              onClick={() => handlePeriodTypeChange('year')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodType === 'year'
                  ? 'bg-[var(--accent-yellow)] text-black'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              년별
            </button>
            <button
              onClick={() => handlePeriodTypeChange('all')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodType === 'all'
                  ? 'bg-[var(--accent-yellow)] text-black'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              전체
            </button>
          </div>

          {/* 년/월 선택 UI (월별 또는 년별일 때만 표시) */}
          {periodType !== 'all' && (
            <div className="relative period-picker">
              <div className="ig-card p-4 border-2 border-[var(--text-primary)]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevPeriod}
                    className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button
                      onClick={handleYearClick}
                      className="px-3 py-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--accent-yellow)]">{selectedYear}</span>
                    </button>
                    <span className="text-[var(--text-secondary)]">년</span>
                    {periodType === 'month' && (
                      <>
                        <button
                          onClick={handleMonthClick}
                          className="px-3 py-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                        >
                          <span className="text-sm font-semibold text-[var(--accent-yellow)]">{selectedMonth}</span>
                        </button>
                        <span className="text-[var(--text-secondary)]">월</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleNextPeriod}
                    className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 연도 선택 드롭다운 */}
              {showYearPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleYearSelect(year)}
                          className={`px-3 py-2 rounded text-sm transition-colors ${
                            selectedYear === year
                              ? 'bg-[var(--accent-yellow)] text-black font-semibold'
                              : year === currentYear
                              ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold'
                              : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 월 선택 드롭다운 (월별일 때만) */}
              {showMonthPicker && periodType === 'month' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month) => (
                        <button
                          key={month}
                          onClick={() => handleMonthSelect(month - 1)}
                          className={`px-3 py-2 rounded text-sm transition-colors ${
                            selectedMonth === month
                              ? 'bg-[var(--accent-yellow)] text-black font-semibold'
                              : month === dayjs().month() + 1 && selectedYear === dayjs().year()
                              ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold'
                              : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                          }`}
                        >
                          {monthNames[month - 1]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 통계 요약 */}
        <div className="ig-card p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">{getPeriodLabel()} 통계</h2>

          {/* 3D 달 애니메이션 */}
          <div className="mb-4">
            <Moon3D moodCounts={moodCounts} totalEntries={totalEntries} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalEntries}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {periodType === 'all' ? '총 기록일' : '기간 기록일'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{getRecordRate()}%</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {periodType === 'month' ? '이번 달 기록률' : periodType === 'year' ? '이번 년 기록률' : '전체 기록률'}
              </div>
            </div>
          </div>

          {/* AI 분석 요약 */}
          {statAnalysis && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">감정 분석</h3>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">{statAnalysis.summary}</p>
              {statAnalysis.insights.length > 0 && (
                <div className="space-y-2">
                  {statAnalysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="text-xs text-[var(--text-secondary)] leading-relaxed pl-4 border-l-2 border-[var(--border-color)]"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 감정별 통계 */}
        <div className="ig-card p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">감정별 통계</h2>
          <div className="space-y-3 mb-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalEntries > 0 ? (item.value / totalEntries) * 100 : 0}%`,
                        backgroundColor: item.fill
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold min-w-[30px] text-right text-[var(--text-primary)]">
                    {item.value}일
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 월별 모드일 때 날짜별 감정 표시 */}
          {periodType === 'month' && dailyMoods.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
              <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">
                {selectedYear}년 {selectedMonth}월 감정 기록
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dailyMoods.map((daily) => {
                  const moodInfo = MOOD_MAPPINGS[daily.mood]
                  // 고유 키 생성: entryId가 있으면 사용, 없으면 date + index 조합
                  const uniqueKey = daily.entryId || `${daily.date}-${daily.index}`
                  return (
                    <div
                      key={uniqueKey}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors"
                    >
                      <span className="text-xl">{moodInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[var(--text-primary)]">{daily.dateLabel}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{moodInfo.name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 월별/년별 활동 차트 (월별 모드일 때는 제외) */}
        {monthlyData.length > 0 && periodType !== 'month' && (
          <div className="ig-card p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {periodType === 'year' ? '월별 활동' : '최근 12개월 활동'}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  stroke="var(--border-color)"
                />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="count" fill="#ffd700" radius={[8, 8, 0, 0]} activeBar={{ fill: '#ffd700', opacity: 1 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 캘린더 (월별일 때만 표시) */}
        {periodType === 'month' && (
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {selectedYear}년 {selectedMonth}월
              </h2>
              <div className="flex gap-2">
                <button onClick={handlePrevPeriod} className="ig-button-secondary px-4 py-2 text-sm">
                  이전
                </button>
                <button
                  onClick={() => {
                    const now = dayjs()
                    setSelectedYear(now.year())
                    setSelectedMonth(now.month() + 1)
                  }}
                  className="ig-button px-4 py-2 text-sm"
                >
                  오늘
                </button>
                <button onClick={handleNextPeriod} className="ig-button-secondary px-4 py-2 text-sm">
                  다음
                </button>
              </div>
            </div>
            <CalendarView year={selectedYear} month={selectedMonth} />
          </div>
        )}

        {/* 회원탈퇴 / 로그아웃 버튼 영역 */}
        <div className="mt-8 mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              setDeletePassword('')
              setDeleteError('')
              setIsDeleteModalOpen(true)
            }}
            className="text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            회원탈퇴
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </main>

      <BottomNavigation />

      {/* 회원탈퇴 확인 모달 */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => {
            if (isDeleting) return
            setIsDeleteModalOpen(false)
          }}
        >
          <div
            className="relative w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">회원탈퇴 확인</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다. 계정 확인을 위해 비밀번호를 입력해 주세요.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value)
                  setDeleteError('')
                }}
                placeholder="비밀번호 입력"
                className={`w-full px-3 py-2 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                  deleteError ? 'border-red-500' : 'border-[var(--border-color)]'
                }`}
                disabled={isDeleting}
              />
              {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
            </div>
            <div className="p-4 pt-0 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (isDeleting) return
                  setIsDeleteModalOpen(false)
                }}
                className="px-3 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!profile?.email) {
                    setDeleteError('세션 정보를 불러올 수 없습니다.')
                    return
                  }
                  if (!deletePassword.trim()) {
                    setDeleteError('비밀번호를 입력해주세요.')
                    return
                  }
                  try {
                    setIsDeleting(true)
                    // 비밀번호 검증 (재인증)
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: profile.email,
                      password: deletePassword
                    })
                    if (error || !data.user) {
                      setDeleteError('비밀번호가 올바르지 않습니다.')
                      setIsDeleting(false)
                      return
                    }

                    // 삭제 요청
                    const res = await fetch('/api/account/delete', { method: 'DELETE' })
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}))
                      setDeleteError(body.error || '회원탈퇴 중 오류가 발생했습니다.')
                      setIsDeleting(false)
                      return
                    }

                    setIsDeleteModalOpen(false)
                    await signOut()
                    showToast('회원 탈퇴가 완료되었습니다.', 'success')
                    setTimeout(() => {
                      router.push('/login')
                    }, 600)
                  } catch (e) {
                    setDeleteError('회원탈퇴 중 오류가 발생했습니다.')
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '처리 중...' : '탈퇴'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
