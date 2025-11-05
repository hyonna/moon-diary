'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function FindPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message || '비밀번호 재설정 이메일 전송에 실패했습니다.')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">비밀번호 찾기</h1>
        </div>
      </header>

      <main className="px-4 py-8 pb-24">
        <div className="max-w-md mx-auto">
          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
                <p className="text-sm text-[var(--text-primary)] mb-2">
                  비밀번호 재설정 링크를 이메일로 전송했습니다.
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  이메일을 확인하여 비밀번호를 재설정해주세요.
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]"
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
              >
                {loading ? '전송 중...' : '비밀번호 재설정 이메일 전송'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

