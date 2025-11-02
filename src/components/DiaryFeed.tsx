'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { DiaryEntry, MOOD_MAPPINGS } from '@/types/diary';
import { diaryService } from '@/lib/supabase';
import { dateUtils } from '@/lib/dateUtils';

interface DiaryFeedProps {
  dateFilter?: string | null;
}

export default function DiaryFeed({ dateFilter }: DiaryFeedProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRef = useRef(0);
  const ITEMS_PER_PAGE = 10;

  const loadEntries = useCallback(async (page: number, filter?: string | null) => {
    if (loading) return;
    setLoading(true);

    try {
      const allEntries = await diaryService.getAllEntries();
      
      // 날짜 필터 적용
      let filteredEntries = allEntries;
      if (filter) {
        const filterDate = dateUtils.parseDate(filter);
        filteredEntries = allEntries.filter((entry) => {
          const entryDate = dateUtils.parseDate(entry.date);
          return (
            entryDate.year() === filterDate.year() &&
            entryDate.month() === filterDate.month()
          );
        });
      }

      // 정렬: 날짜 기준 최신순 (날짜가 같으면 created_at 기준 최신순)
      filteredEntries.sort((a, b) => {
        const dateA = dateUtils.parseDate(a.date);
        const dateB = dateUtils.parseDate(b.date);
        
        const dateDiff = dateB.diff(dateA, 'day');
        if (dateDiff !== 0) {
          return dateDiff; // 날짜 기준 내림차순 (최신 날짜 먼저)
        }
        
        // 같은 날짜면 created_at 기준 내림차순
        if (a.created_at && b.created_at) {
          return dateUtils.parseDate(b.created_at).diff(dateUtils.parseDate(a.created_at), 'millisecond');
        }
        return 0;
      });

      // 페이지네이션
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageEntries = filteredEntries.slice(startIndex, endIndex);

      if (page === 0) {
        setEntries(pageEntries);
      } else {
        setEntries((prev) => [...prev, ...pageEntries]);
      }

      setHasMore(endIndex < filteredEntries.length);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    pageRef.current = 0;
    loadEntries(0, dateFilter);
  }, [dateFilter]);

  const lastEntryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          pageRef.current += 1;
          loadEntries(pageRef.current, dateFilter);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, dateFilter, loadEntries]
  );

  const formatDate = (dateString: string) => {
    const date = dateUtils.parseDate(dateString);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    
    let relativeDate = '';
    let actualDate = date.format('M월 D일');
    
    if (date.isSame(today, 'day')) {
      relativeDate = '오늘';
    } else if (date.isSame(yesterday, 'day')) {
      relativeDate = '어제';
    } else {
      relativeDate = date.format('YYYY년 M월 D일 ddd');
      actualDate = ''; // 이미 날짜가 포함되어 있으므로 중복 방지
    }
    
    return {
      relative: relativeDate,
      actual: actualDate,
    };
  };

  if (entries.length === 0 && !loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--text-secondary)] text-sm">아직 기록된 일기가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {entries.map((entry, index) => {
        const mapping = MOOD_MAPPINGS[entry.mood];
        const isLast = index === entries.length - 1;

        return (
          <div
            key={entry.id || `entry-${entry.date}-${index}`}
            ref={isLast && hasMore ? lastEntryRef : null}
            className="border-b border-[var(--border-color)] pb-4 mb-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors -mx-4 px-4 py-3"
            onClick={() => router.push(`/write?id=${entry.id}`)}
          >
            <div className="flex items-start gap-3">
              {/* 프로필/아바타 영역 - Threads 스타일 */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl border border-[var(--border-color)]">
                  {mapping.emoji}
                </div>
              </div>
              
              {/* 콘텐츠 영역 */}
              <div className="flex-1 min-w-0">
                {/* 헤더: 날짜 + 시간 + 감정 상태 */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {entry.created_at
                      ? dateUtils.formatRelativeTime(entry.created_at)
                      : (() => {
                          const dateInfo = formatDate(entry.date);
                          return (
                            <>
                              {dateInfo.relative}
                              {dateInfo.actual && (
                                <>
                                  {' '}
                                  <span className="text-xs font-normal text-[var(--text-secondary)]">
                                    ({dateInfo.actual})
                                  </span>
                                </>
                              )}
                            </>
                          );
                        })()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">·</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {mapping.name}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">·</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {mapping.description}
                  </span>
                </div>
                
                {/* 본문 */}
                {entry.note && (
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words leading-relaxed mt-2">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="py-8 text-center">
          <p className="text-[var(--text-secondary)] text-sm">로딩 중...</p>
        </div>
      )}

    </div>
  );
}

