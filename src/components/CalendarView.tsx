'use client';

import { useEffect, useState } from 'react';
import { DiaryEntry, MoonPhase, MOOD_MAPPINGS } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { dateUtils } from '@/lib/dateUtils';

interface CalendarViewProps {
  year: number;
  month: number;
}

export default function CalendarView({ year, month }: CalendarViewProps) {
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});

  useEffect(() => {
    // 해당 월의 시작일과 종료일 계산
    const firstDay = dateUtils.getFirstDayOfMonth(year, month);
    const lastDay = dateUtils.getLastDayOfMonth(year, month);
    const startDate = firstDay.format('YYYY-MM-DD');
    const endDate = lastDay.format('YYYY-MM-DD');

    diaryService.getEntriesByDateRange(startDate, endDate).then((data) => {
      const entriesMap: Record<string, DiaryEntry> = {};
      data.forEach((entry) => {
        entriesMap[entry.date] = entry;
      });
      setEntries(entriesMap);
    });
  }, [year, month]);

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
    const entry = entries[date];
    if (!entry) return null;
    return MOOD_MAPPINGS[entry.mood].emoji;
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
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {day}
              </div>
              {emoji && (
                <div className="text-xl" title={entries[dateStr]?.note || ''}>
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

