'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateUtils } from '@/lib/dateUtils';

interface DateFilterProps {
  onFilterChange: (date: string | null) => void;
}

export default function DateFilter({ onFilterChange }: DateFilterProps) {
  const now = dayjs();
  const [currentMonth, setCurrentMonth] = useState(now);
  const [selectedYear, setSelectedYear] = useState<number>(now.year());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.month() + 1);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    // 선택된 연도/월에 해당하는 월의 첫 번째 날짜로 필터 적용
    const monthStart = dateUtils.getFirstDayOfMonth(
      selectedYear,
      selectedMonth
    ).format('YYYY-MM-DD');
    onFilterChange(monthStart);
  }, [selectedYear, selectedMonth, onFilterChange]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  };

  const handleYearClick = () => {
    setShowYearPicker(!showYearPicker);
    setShowMonthPicker(false);
  };

  const handleMonthClick = () => {
    setShowMonthPicker(!showMonthPicker);
    setShowYearPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setCurrentMonth(dayjs().year(year).month(currentMonth.month()));
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month: number) => {
    // month는 0-11 인덱스이므로 1-12로 변환하여 저장
    setSelectedMonth(month + 1);
    setCurrentMonth(dayjs().year(currentMonth.year()).month(month));
    setShowMonthPicker(false);
  };

  const formatMonthYear = (date: dayjs.Dayjs) => {
    return date.format('YYYY년 M월');
  };

  // 연도 리스트 생성 (현재 연도 기준 ±5년)
  const currentYear = dayjs().year();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  // 월 리스트
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div className="relative">
      <div className="ig-card p-2 border-2 border-[var(--text-primary)] flex items-center min-h-[44px]">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handlePrevMonth}
            className="p-0.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <button
              onClick={handleYearClick}
              className="px-2 py-0.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
            >
              <span className="text-sm font-semibold text-[var(--accent-yellow)]">
                {currentMonth.format('YYYY')}
              </span>
            </button>
            <span className="text-[var(--text-secondary)] text-sm">년</span>
            <button
              onClick={handleMonthClick}
              className="px-2 py-0.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
            >
              <span className="text-sm font-semibold text-[var(--accent-yellow)]">
                {currentMonth.format('M')}
              </span>
            </button>
            <span className="text-[var(--text-secondary)] text-sm">월</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-0.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
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

      {/* 월 선택 드롭다운 */}
      {showMonthPicker && (
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
                      : month === dayjs().month() + 1 && currentMonth.year() === dayjs().year()
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
  );
}

