'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface SignupFormData {
  email: string
  nickname: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { signUp } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SignupFormData>({
    mode: 'onBlur'
  })

  const password = watch('password')

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  const onSubmit = async (data: SignupFormData) => {
    setError('')
    setLoading(true)

    const { error } = await signUp(data.email, data.password, data.nickname.trim())

    if (error) {
      setError(error.message || '회원가입에 실패했습니다.')
      setLoading(false)
    } else {
      // 회원가입 성공 - 이메일 인증 안내
      alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
      router.push('/login')
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

          {/* 회원가입 폼 */}
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
                <label htmlFor="nickname" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  닉네임
                </label>
                <input
                  id="nickname"
                  type="text"
                  {...register('nickname', {
                    required: '닉네임을 입력해주세요',
                    maxLength: {
                      value: 20,
                      message: '닉네임은 최대 20자까지 입력 가능합니다'
                    },
                    validate: (value) => {
                      if (!value.trim()) {
                        return '닉네임을 입력해주세요'
                      }
                      return true
                    }
                  })}
                  maxLength={20}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.nickname ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="닉네임을 입력하세요"
                />
                {errors.nickname && <p className="mt-1.5 text-xs text-red-500">{errors.nickname.message}</p>}
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
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    required: '비밀번호 확인을 입력해주세요',
                    validate: (value) => {
                      if (value !== password) {
                        return '비밀번호가 일치하지 않습니다'
                      }
                      return true
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.confirmPassword ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 active:opacity-80 transition-all font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>가입 중...</span>
                  </>
                ) : (
                  '회원가입'
                )}
              </button>
            </form>
          </div>

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <Link
              href="/login"
              className="block py-2.5 hover:opacity-70 transition-opacity text-sm font-medium text-[var(--text-primary)]"
            >
              이미 계정이 있으신가요? <span className="text-[var(--accent-yellow)] font-semibold">로그인</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

