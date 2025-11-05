'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import SignupModal from '@/components/SignupModal'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    mode: 'onBlur'
  })

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setLoading(true)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      setError(error.message || '로그인에 실패했습니다.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 백그라운드 그라데이션 */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--accent-yellow)]/20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(255, 215, 0, 0) 70%, rgba(255, 215, 0, 0.05) 100%)'
        }}
      />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          {/* 로고 및 캐치프라이즈 */}
          <div className="mb-10">
            {/* 헤더 스타일 로고 */}
            <div className="text-center">
              <h1
                className="moon-diary-title text-[var(--text-primary)] font-bold inline-block"
                style={{ fontSize: '2.2rem' }}
              >
                <span className="text-2xl mr-2">🌙</span> Moon Diary
              </h1>
            </div>

            {/* 캐치프라이즈 */}
            <div className="text-center space-y-1.5">
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed px-4">
                오늘의 감정, 달로 기록하다
              </p>
            </div>
          </div>

          {/* 로그인 폼 카드 */}
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '올바른 이메일 형식을 입력해주세요'
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.email ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="이메일을 입력하세요"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password', {
                    required: '비밀번호를 입력해주세요',
                    minLength: {
                      value: 6,
                      message: '비밀번호는 최소 6자 이상이어야 합니다'
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.password ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="비밀번호를 입력하세요"
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 active:opacity-80 transition-all font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-24"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>로그인 중...</span>
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>
          </div>

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="block w-full py-2.5 hover:opacity-70 transition-opacity text-sm font-medium text-[var(--text-primary)]"
            >
              계정이 없으신가요? <span className="text-[var(--accent-yellow)] font-semibold">회원가입</span>
            </button>

            <div className="flex justify-center gap-3 text-xs text-[var(--text-secondary)] pt-1">
              <Link href="/find-email" className="hover:text-[var(--text-primary)] transition-colors">
                이메일 찾기
              </Link>
              <span>•</span>
              <Link href="/find-password" className="hover:text-[var(--text-primary)] transition-colors">
                비밀번호 찾기
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}
