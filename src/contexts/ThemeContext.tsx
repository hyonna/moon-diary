'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 항상 다크 모드만 사용
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  }, [])

  // 항상 Provider를 렌더링하여 useTheme이 에러를 발생시키지 않도록 함
  // 라이트 모드 제거: 항상 다크 모드
  return <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
