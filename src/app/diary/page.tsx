'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import DiaryForm from '@/components/DiaryForm';
import CalendarView from '@/components/CalendarView';
import StatisticsChart from '@/components/StatisticsChart';
import Navigation from '@/components/Navigation';

export default function DiaryPage() {
  const router = useRouter();
  const { status } = useSession();
  const now = dayjs();
  const [currentYear, setCurrentYear] = useState(now.year());
  const [currentMonth, setCurrentMonth] = useState(now.month() + 1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-secondary)]">로딩 중...</p>
      </div>
    );
  }

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
      <Navigation />
      <main className="w-full px-4 py-8">
        <div className="grid grid-cols-1 gap-6 mb-8">
          <DiaryForm />
          <StatisticsChart />
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-semibold">
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
    </>
  );
}
