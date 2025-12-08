'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { dateUtils } from '@/lib/dateUtils';

interface CalendarViewProps {
  year: number;
  month: number;
  averageMoodEmoji?: string | null;
}

export default function CalendarView({ year, month, averageMoodEmoji }: CalendarViewProps) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<Record<string, DiaryEntry[]>>({});

  useEffect(() => {
    if (!session?.user?.id) return;
    // 해당 월의 시작일과 종료일 계산
    const firstDay = dateUtils.getFirstDayOfMonth(year, month);
    const lastDay = dateUtils.getLastDayOfMonth(year, month);
    const startDate = firstDay.format('YYYY-MM-DD');
    const endDate = lastDay.format('YYYY-MM-DD');

    diaryService.getEntriesByDateRange(startDate, endDate, session.user.id).then((data) => {
      const entriesMap: Record<string, DiaryEntry[]> = {};
      data.forEach((entry) => {
        if (!entriesMap[entry.date]) {
          entriesMap[entry.date] = [];
        }
        entriesMap[entry.date].push(entry);
      });
      setEntries(entriesMap);
    });
  }, [year, month, session]);

  // 달력 생성
  const firstDayOfWeek = dateUtils.getFirstDayOfWeek(year, month);
  const daysInMonth = dateUtils.getDaysInMonth(year, month);
  const days: (number | null)[] = [];

  // 빈 칸 채우기
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  // 날짜 채우기
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getDateString = (day: number) => {
    return dateUtils.formatDate(dateUtils.getFirstDayOfMonth(year, month).date(day));
  };

  const getMoodEmoji = (date: string): string | null => {
    const dateEntries = entries[date];
    if (!dateEntries || dateEntries.length === 0) return null;
    // 평균 감정 이모지 사용 (전달된 경우), 없으면 해당 날짜의 감정 이모지
    return averageMoodEmoji || MOOD_MAPPINGS[dateEntries[0].mood].emoji;
  };

  const getEntryCount = (date: string): number => {
    const dateEntries = entries[date];
    return dateEntries ? dateEntries.length : 0;
  };

  const getTooltipText = (date: string): string => {
    const count = getEntryCount(date);
    const dateLabel = dateUtils.parseDate(date).format('M월 D일');
    
    if (count === 0) {
      return `${dateLabel}\n일기 없음`;
    }
    
    return `${dateLabel}\n일기 ${count}개`;
  };

  return (
    <div className="ig-card p-6">
      <div className="grid grid-cols-7 gap-1 mb-3">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-[var(--text-secondary)] py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${year}-${month}-${index}`} className="aspect-square" />;
          }

          const dateStr = getDateString(day);
          const emoji = getMoodEmoji(dateStr);
          const isToday = dateStr === dateUtils.getTodayString();
          const tooltipText = getTooltipText(dateStr);

          return (
            <div
              key={`date-${year}-${month}-${day}`}
              className={`
                aspect-square rounded-lg border flex flex-col items-center justify-center transition-all
                ${isToday 
                  ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)]' 
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]'
                }
                ${emoji ? 'cursor-pointer' : ''}
              `}
              title={tooltipText}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {day}
              </div>
              {emoji && (
                <div className="text-xl">
                  {emoji}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

