'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { dateUtils } from '@/lib/dateUtils';

interface DateFilterProps {
  onFilterChange: (date: string | null) => void;
}

export default function DateFilter({ onFilterChange }: DateFilterProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = dateUtils.getFirstDayOfMonth(
        currentMonth.year(),
        currentMonth.month() + 1
      ).format('YYYY-MM-DD');
      onFilterChange(dateStr);
    } else {
      onFilterChange(null);
    }
  }, [selectedDate, currentMonth, onFilterChange]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  const handleMonthSelect = () => {
    const currentMonthStr = dateUtils.getFirstDayOfMonth(
      currentMonth.year(),
      currentMonth.month() + 1
    ).format('YYYY-MM-DD');
    
    if (selectedDate === currentMonthStr) {
      setSelectedDate(null);
    } else {
      setSelectedDate(currentMonthStr);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
  };

  const formatMonthYear = (date: dayjs.Dayjs) => {
    return date.format('YYYY년 M월');
  };

  const currentMonthStr = dateUtils.getFirstDayOfMonth(
    currentMonth.year(),
    currentMonth.month() + 1
  ).format('YYYY-MM-DD');
  const isSelected = selectedDate === currentMonthStr;

  return (
    <div className={`ig-card p-4 mb-4 ${isSelected ? 'border-2 border-[var(--text-primary)]' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleMonthSelect}
            className="flex-1 text-center py-1 px-2 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <span className="text-sm font-semibold">
              {formatMonthYear(currentMonth)}
            </span>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {selectedDate && (
          <button
            onClick={handleClear}
            className="ml-2 p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        월을 선택하여 해당 월의 일기만 보기
      </div>
    </div>
  );
}

