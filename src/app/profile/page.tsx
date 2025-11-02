'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { dateUtils } from '@/lib/dateUtils';
import { analyzeStats } from '@/lib/analyzeStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import BottomNavigation from '@/components/BottomNavigation';
import CalendarView from '@/components/CalendarView';
import Moon3D from '@/components/Moon3D';

export default function ProfilePage() {
  const now = dayjs();
  const [currentYear, setCurrentYear] = useState(now.year());
  const [currentMonth, setCurrentMonth] = useState(now.month() + 1);
  const [moodCounts, setMoodCounts] = useState<Record<MoonPhase, number>>({
    new: 0,
    waxing: 0,
    full: 0,
    waning: 0,
  });
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; count: number }>>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [statAnalysis, setStatAnalysis] = useState<{
    summary: string;
    insights: string[];
  } | null>(null);

  // COLORS를 컴포넌트 상단에 정의
  const COLORS = {
    new: '#6366f1',
    waxing: '#8b5cf6',
    full: '#ec4899',
    waning: '#06b6d4',
  };

  function getColorForPhase(phase: MoonPhase): string {
    return COLORS[phase];
  }

  useEffect(() => {
    diaryService.getAllEntries().then((entries) => {
      setTotalEntries(entries.length);

      // 감정별 통계
      const counts: Record<MoonPhase, number> = {
        new: 0,
        waxing: 0,
        full: 0,
        waning: 0,
      };

      entries.forEach((entry) => {
        counts[entry.mood]++;
      });

      setMoodCounts(counts);

      // 월별 통계 (최근 6개월)
      const monthlyMap = new Map<string, number>();
      const sixMonthsAgo = dayjs().subtract(6, 'month');

      entries.forEach((entry) => {
        const entryDate = dateUtils.parseDate(entry.date);
        if (entryDate.isAfter(sixMonthsAgo) || entryDate.isSame(sixMonthsAgo, 'month')) {
          const monthKey = entryDate.format('YYYY년 M월');
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
        }
      });

      const monthly = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const dateA = dayjs(a.month);
          const dateB = dayjs(b.month);
          return dateA.diff(dateB);
        });

      setMonthlyData(monthly);

      // AI 통계 분석
      const analysis = analyzeStats(entries);
      setStatAnalysis({
        summary: analysis.summary,
        insights: analysis.insights,
      });
    });
  }, []);

  const chartData = Object.entries(MOOD_MAPPINGS).map(([phase, mapping]) => ({
    name: mapping.name,
    value: moodCounts[phase as MoonPhase],
    emoji: mapping.emoji,
    fill: getColorForPhase(phase as MoonPhase),
  }));

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-color)] backdrop-blur-sm bg-opacity-80">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">내 정보</h1>
          </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* 통계 요약 */}
        <div className="ig-card p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">통계 요약</h2>
          
          {/* 3D 달 애니메이션 */}
          <div className="mb-4">
            <Moon3D moodCounts={moodCounts} totalEntries={totalEntries} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{totalEntries}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">총 기록일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {totalEntries > 0 ? Math.round((totalEntries / dayjs().date()) * 100) : 0}%
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">이번 달 기록률</div>
            </div>
          </div>

          {/* AI 분석 요약 */}
          {statAnalysis && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">감정 분석</h3>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
                {statAnalysis.summary}
              </p>
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
                        backgroundColor: item.fill,
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
        </div>

        {/* 월별 활동 차트 */}
        {monthlyData.length > 0 && (
          <div className="ig-card p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">최근 6개월 활동</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  stroke="var(--border-color)"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                  stroke="var(--border-color)" 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 캘린더 */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {currentYear}년 {currentMonth}월
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="ig-button-secondary px-4 py-2 text-sm"
              >
                이전
              </button>
              <button
                onClick={() => {
                  const now = dayjs();
                  setCurrentYear(now.year());
                  setCurrentMonth(now.month() + 1);
                }}
                className="ig-button px-4 py-2 text-sm"
              >
                오늘
              </button>
              <button
                onClick={handleNextMonth}
                className="ig-button-secondary px-4 py-2 text-sm"
              >
                다음
              </button>
            </div>
          </div>
          <CalendarView year={currentYear} month={currentMonth} />
        </div>
      </main>

      <BottomNavigation />
    </>
  );
}

