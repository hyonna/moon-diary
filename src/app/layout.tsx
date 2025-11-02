import './globals.css'
import { Providers } from './Providers'

export const metadata = {
  title: 'Moon-Mood Diary',
  description: '달의 모양으로 감정을 기록하는 일기'
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
