import './globals.css'
import { Providers } from './Providers'

export const metadata = {
  title: 'Moon Diary - 오늘의 감정, 달로 기록하다',
  description: '오늘의 감정, 달로 기록하다',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    apple: '/icon.svg',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="page-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
