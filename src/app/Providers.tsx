'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { SessionProvider } from '@/components/SessionProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

