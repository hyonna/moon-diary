'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[520px] bg-[var(--bg-primary)] border-t border-[var(--border-color)] z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-4 py-2">
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive('/')
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">홈</span>
        </button>

        <button
          onClick={() => router.push('/write')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-80 transition-opacity"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => router.push('/profile')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">내 정보</span>
        </button>
      </div>
    </nav>
  );
}

