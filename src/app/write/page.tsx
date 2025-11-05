'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BottomNavigation from '@/components/BottomNavigation';
import WriteContent from './WriteContent';

export default function WritePage() {
  const router = useRouter();
  const { status } = useSession();

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

