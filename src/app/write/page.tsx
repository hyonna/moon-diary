'use client';

import { Suspense } from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import WriteContent from './WriteContent';

export default function WritePage() {
  return (
    <>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[var(--text-secondary)]">로딩 중...</p>
        </div>
      }>
        <WriteContent />
      </Suspense>
      <BottomNavigation />
    </>
  );
}

