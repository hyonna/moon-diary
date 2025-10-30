import './globals.css'

export const metadata = {
  title: 'Moon-Mood Diary',
  description: '달의 모양으로 감정을 기록하는 일기'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
