'use client';

import { useState, useEffect } from 'react';
import { MoonPhase, DiaryEntry } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import MoodSelector from './MoodSelector';

export default function DiaryForm() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedMood, setSelectedMood] = useState<MoonPhase | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    // 오늘의 일기 불러오기
    diaryService.getTodayEntry(today).then((entry) => {
      if (entry) {
        setExistingEntry(entry);
        setSelectedMood(entry.mood);
        setNote(entry.note || '');
        setIsSaved(true);
      }
    });
  }, [today]);

  const handleSave = async () => {
    if (!selectedMood) {
      alert('감정을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    const entry: DiaryEntry = {
      date: today,
      mood: selectedMood,
      note: note.trim() || undefined,
    };

    const result = await diaryService.upsertEntry(entry);

    if (result) {
      setIsSaved(true);
      setExistingEntry(result);
      alert('저장되었습니다!');
    } else {
      alert('저장 중 오류가 발생했습니다.');
    }

    setIsLoading(false);
  };

  return (
    <div className="ig-card p-6">
      <div className="mb-6 pb-4 border-b border-[var(--border-color)]">
        <h2 className="text-xl font-semibold">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
          오늘의 감정 상태
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
          rows={4}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || !selectedMood}
        className={`
          w-full py-2.5 px-4 rounded-lg font-semibold text-sm
          ${isLoading || !selectedMood
            ? 'bg-[#efefef] text-[#c7c7c7] cursor-not-allowed'
            : 'ig-button'
          }
        `}
      >
        {isLoading ? '저장 중...' : isSaved ? '업데이트' : '저장'}
      </button>
    </div>
  );
}

