import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary'
import dayjs from 'dayjs'
import { dateUtils } from './dateUtils'

interface StatAnalysis {
  summary: string
  insights: string[]
  dominantMood: MoonPhase | null
  moodBalance: 'balanced' | 'positive' | 'neutral' | 'negative'
}

export function analyzeStats(entries: DiaryEntry[]): StatAnalysis {
  if (entries.length === 0) {
    return {
      summary: '아직 기록된 일기가 없습니다. 첫 일기를 작성해보세요! 🌙',
      insights: [],
      dominantMood: null,
      moodBalance: 'balanced'
    }
  }

  // 감정별 카운트
  const moodCounts: Record<MoonPhase, number> = {
    new: 0,
    waxing: 0,
    full: 0,
    waning: 0
  }

  entries.forEach((entry) => {
    moodCounts[entry.mood]++
  })

  // 가장 많이 기록한 감정
  const dominantMood = Object.entries(moodCounts).reduce(
    (maxEntry, currentEntry) => {
      const [, maxCount] = maxEntry
      const [, currentCount] = currentEntry
      return currentCount > maxCount ? currentEntry : maxEntry
    },
    ['new', moodCounts['new']] as [MoonPhase, number]
  )[0] as MoonPhase

  const dominantMoodName = MOOD_MAPPINGS[dominantMood].name
  const dominantCount = moodCounts[dominantMood]
  const dominantPercentage = Math.round((dominantCount / entries.length) * 100)

  // 감정 밸런스 분석
  const positiveCount = moodCounts.full + moodCounts.waxing
  const negativeCount = moodCounts.new
  const neutralCount = moodCounts.waning

  const positiveRatio = positiveCount / entries.length
  const negativeRatio = negativeCount / entries.length
  const neutralRatio = neutralCount / entries.length

  let moodBalance: 'balanced' | 'positive' | 'neutral' | 'negative'
  if (negativeRatio > 0.4) {
    moodBalance = 'negative'
  } else if (positiveRatio > 0.5) {
    moodBalance = 'positive'
  } else if (neutralRatio > 0.4) {
    moodBalance = 'neutral'
  } else {
    moodBalance = 'balanced'
  }

  // 최근 감정 변화 분석 (최근 2주 vs 그 전)
  const now = dayjs()
  const twoWeeksAgo = now.subtract(14, 'day')

  const recentEntries = entries.filter((entry) => {
    const entryDate = dateUtils.parseDate(entry.date)
    return entryDate.isAfter(twoWeeksAgo)
  })

  const olderEntries = entries.filter((entry) => {
    const entryDate = dateUtils.parseDate(entry.date)
    return entryDate.isBefore(twoWeeksAgo)
  })

  let recentTrend: 'improving' | 'declining' | 'stable' | 'insufficient'
  if (recentEntries.length === 0) {
    recentTrend = 'insufficient'
  } else if (olderEntries.length === 0) {
    recentTrend = 'stable'
  } else {
    const recentPositive = recentEntries.filter((e) => e.mood === 'full' || e.mood === 'waxing').length
    const olderPositive = olderEntries.filter((e) => e.mood === 'full' || e.mood === 'waxing').length

    const recentPositiveRatio = recentPositive / recentEntries.length
    const olderPositiveRatio = olderPositive / olderEntries.length

    if (recentPositiveRatio > olderPositiveRatio + 0.15) {
      recentTrend = 'improving'
    } else if (recentPositiveRatio < olderPositiveRatio - 0.15) {
      recentTrend = 'declining'
    } else {
      recentTrend = 'stable'
    }
  }

  // 요약 생성
  let summary = ''
  if (entries.length < 5) {
    summary = `${dominantMoodName}(${MOOD_MAPPINGS[dominantMood].emoji}) 감정이 ${dominantPercentage}%로 가장 많이 기록되었습니다. 더 많은 일기를 작성하면 더 정확한 분석을 제공할 수 있어요!`
  } else {
    summary = `당신의 감정 패턴을 분석한 결과, ${dominantMoodName}(${MOOD_MAPPINGS[dominantMood].emoji})이 ${dominantPercentage}%로 가장 많이 기록되었습니다.`
  }

  // 인사이트 생성
  const insights: string[] = []

  // 감정 밸런스 인사이트
  if (moodBalance === 'positive') {
    insights.push(
      `긍정적인 감정(보름달, 상현달)이 ${Math.round(
        positiveRatio * 100
      )}%로 높은 편입니다. 에너지 넘치는 하루들이 많으시네요! 🌟`
    )
  } else if (moodBalance === 'negative') {
    insights.push(
      `신월 감정이 ${Math.round(
        negativeRatio * 100
      )}%로 높습니다. 힘든 순간들도 소중한 기록이에요. 지금의 감정을 충분히 인정하고 보살피세요. 💙`
    )
  } else if (moodBalance === 'neutral') {
    insights.push(
      `평온한 감정(하현달)이 ${Math.round(
        neutralRatio * 100
      )}%로 많은 편입니다. 안정적인 일상 속에서 평화롭게 지내고 계시네요. 😌`
    )
  } else {
    insights.push(`감정 분포가 비교적 균형 잡혀 있습니다. 다양한 감정을 경험하며 풍부한 하루를 보내고 계시네요. ✨`)
  }

  // 최근 추이 인사이트
  if (recentTrend === 'improving') {
    insights.push(`최근 2주간 긍정적인 감정이 증가하고 있습니다. 좋은 변화가 느껴지네요! 🌈`)
  } else if (recentTrend === 'declining') {
    insights.push(`최근 2주간 감정 변화가 있었습니다. 충분한 휴식과 자기 관리를 권해드려요. 💭`)
  } else if (recentTrend === 'stable') {
    insights.push(`최근 감정 패턴이 안정적으로 유지되고 있습니다.`)
  }

  // 기록 패턴 인사이트
  const sortedEntries = [...entries].sort((a, b) => {
    return dateUtils.parseDate(a.date).diff(dateUtils.parseDate(b.date))
  })

  const firstEntryDate = sortedEntries.length > 0 ? dateUtils.parseDate(sortedEntries[0].date) : null

  const daysSinceFirstEntry = firstEntryDate ? dayjs().diff(firstEntryDate, 'day') : 0

  const avgEntriesPerWeek =
    entries.length > 0 && daysSinceFirstEntry > 0
      ? (entries.length / Math.max(daysSinceFirstEntry / 7, 1)).toFixed(1)
      : '0'

  if (entries.length >= 10) {
    if (parseFloat(avgEntriesPerWeek) >= 4) {
      insights.push(`주당 평균 ${avgEntriesPerWeek}회의 기록으로 꾸준히 감정을 기록하고 계시네요! 📝`)
    } else if (parseFloat(avgEntriesPerWeek) >= 2) {
      insights.push(`주당 평균 ${avgEntriesPerWeek}회 정도 기록하고 있습니다. 꾸준함이 답이에요! 💪`)
    }
  }

  // 특별한 패턴
  const fullMoonDays = entries.filter((e) => e.mood === 'full').length
  if (fullMoonDays > entries.length * 0.4) {
    insights.push(
      `보름달 감정이 ${Math.round(
        (fullMoonDays / entries.length) * 100
      )}%로 높습니다. 에너지가 넘치는 당신이 멋져요! ⭐`
    )
  }

  return {
    summary,
    insights,
    dominantMood,
    moodBalance
  }
}
