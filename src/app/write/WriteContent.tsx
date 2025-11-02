'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MoonPhase, DiaryEntry } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { dateUtils } from '@/lib/dateUtils';
import MoodSelector from '@/components/MoodSelector';

export default function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryIdParam = searchParams.get('id');
  const dateParam = searchParams.get('date');
  const today = dateUtils.getTodayString();
  const targetDate = dateParam || today;
  const isEditMode = !!entryIdParam;
  
  const [selectedMood, setSelectedMood] = useState<MoonPhase | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 수정 모드일 때만 기존 일기 로드 (id 기반)
    if (isEditMode && entryIdParam) {
      diaryService.getEntryById(entryIdParam).then((entry) => {
        if (entry) {
          setExistingEntry(entry);
          setSelectedMood(entry.mood);
          setNote(entry.note || '');
        } else {
          // 수정 모드인데 일기가 없으면 홈으로 리다이렉트
          router.push('/');
        }
        setIsInitialized(true);
      });
    } else {
      // 새 작성 모드: 항상 빈 상태로 시작 (여러 개 작성 가능)
      setExistingEntry(null);
      setSelectedMood(null);
      setNote('');
      setIsInitialized(true);
    }
  }, [entryIdParam, isEditMode, router]);

  const handleSave = async () => {
    if (!selectedMood) {
      alert('감정을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    if (isEditMode && existingEntry?.id) {
      // 수정 모드: 기존 일기 업데이트
      const result = await diaryService.updateEntry(existingEntry.id, {
        mood: selectedMood,
        note: note.trim() || undefined,
      });

      if (result) {
        router.push('/');
      } else {
        alert('수정 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    } else {
      // 새 작성 모드: 항상 새로 생성
      const entry: DiaryEntry = {
        date: targetDate,
        mood: selectedMood,
        note: note.trim() || undefined,
      };

      const result = await diaryService.insertEntry(entry);

      if (result) {
        router.push('/');
      } else {
        alert('저장 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-color)] backdrop-blur-sm bg-opacity-80">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <h2 className="flex-1 text-center text-lg font-semibold text-[var(--text-primary)]">
            {isEditMode ? '일기 수정' : '새 일기'}
          </h2>
          {/* 아이콘과 제목의 균형을 맞추기 위한 빈 공간 */}
          <div className="w-9" />
        </div>
      </header>

      <main className="px-4 py-6 pb-24">
        <div className="ig-card p-6">
          <div className="mb-6 pb-4 border-b border-[var(--border-color)] text-center">
            <h2 className="text-xl font-semibold mb-1 text-[var(--text-primary)]">
              {dateUtils.formatDateKorean(targetDate)}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {isEditMode ? '일기를 수정하세요' : '감정을 기록하세요'}
            </p>
          </div>

          {!isInitialized ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">로딩 중...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                  감정 상태
                </label>
                <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                  메모
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="오늘 하루를 간단히 기록해보세요..."
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] focus:outline-none focus:border-[var(--text-primary)] resize-none text-sm"
                  rows={6}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isLoading || !selectedMood}
                className={`
                  w-full py-2.5 px-4 rounded-lg font-semibold text-sm
                  ${isLoading || !selectedMood
                    ? 'bg-[#efefef] text-[#c7c7c7] cursor-not-allowed dark:bg-[#2a2a2a] dark:text-[#5a5a5a]'
                    : 'ig-button'
                  }
                `}
              >
                {isLoading ? '저장 중...' : isEditMode ? '수정' : '저장'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}

