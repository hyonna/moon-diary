'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // URL 해시에서 access_token과 refresh_token 확인
    const hash = window.location.hash
    if (!hash && !searchParams.get('access_token')) {
      setError('잘못된 링크입니다.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    const { error } = await updatePassword(password)

    if (error) {
      setError(error.message || '비밀번호 재설정에 실패했습니다.')
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  if (success) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
          <div className="flex items-center justify-center px-4 py-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">비밀번호 재설정</h1>
          </div>
        </header>

        <main className="px-4 py-8 pb-24">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-center">
              <p className="text-base font-semibold text-[var(--text-primary)] mb-2">
                비밀번호가 성공적으로 변경되었습니다.
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                로그인 페이지로 이동합니다...
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">비밀번호 재설정</h1>
        </div>
      </header>

      <main className="px-4 py-8 pb-24">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                새 비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]"
                placeholder="새 비밀번호를 입력하세요 (최소 6자)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                새 비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]"
                placeholder="새 비밀번호를 다시 입력하세요"
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
              {loading ? '재설정 중...' : '비밀번호 재설정'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-secondary)]">로딩 중...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

