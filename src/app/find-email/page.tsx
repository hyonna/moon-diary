'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function FindEmailPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [foundEmail, setFoundEmail] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFoundEmail(null)
    setLoading(true)

    try {
      // user_profiles에서 닉네임으로 이메일 찾기
      const { data, error: queryError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('nickname', nickname.trim())
        .single()

      if (queryError || !data) {
        setError('해당 닉네임으로 등록된 이메일을 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      setFoundEmail(data.email)
    } catch (err) {
      setError('이메일 찾기 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">이메일 찾기</h1>
        </div>
      </header>

      <main className="px-4 py-8 pb-24">
        <div className="max-w-md mx-auto">
          {foundEmail ? (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)] mb-2">등록된 이메일</p>
                <p className="text-base font-semibold text-[var(--text-primary)]">{foundEmail}</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                로그인하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  닉네임
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)]"
                  placeholder="가입 시 사용한 닉네임을 입력하세요"
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
                {loading ? '찾는 중...' : '이메일 찾기'}
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

