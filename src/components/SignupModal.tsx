'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SignupFormData {
  email: string
  nickname: string
  password: string
  confirmPassword: string
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const router = useRouter()
  const { signUp } = useAuth()
  const { showToast } = useToast()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors }
  } = useForm<SignupFormData>({
    mode: 'onBlur'
  })

  const password = watch('password')
  const email = watch('email')
  const nickname = watch('nickname')
  const confirmPassword = watch('confirmPassword')

  // 비밀번호가 변경되면 비밀번호 확인 필드도 다시 검증
  useEffect(() => {
    if (confirmPassword && password) {
      trigger('confirmPassword')
    }
  }, [password, confirmPassword, trigger])

  // 모든 필드가 입력되었는지 확인 (비밀번호 일치 여부도 포함)
  const isFormValid = 
    email && 
    nickname && 
    password && 
    confirmPassword && 
    password === confirmPassword &&
    !errors.email && 
    !errors.nickname && 
    !errors.password && 
    !errors.confirmPassword

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const onSubmit = async (data: SignupFormData) => {
    setError('')
    setLoading(true)

    // 회원가입 시 메타데이터에 닉네임 포함
    const { error } = await signUp(data.email, data.password, data.nickname.trim())

    if (error) {
      setError(error.message || '회원가입에 실패했습니다.')
      setLoading(false)
    } else {
      // 회원가입 성공
      reset()
      onClose()
      showToast('회원가입이 완료되었습니다.', 'success')
      // 자동 로그인되므로 홈으로 이동
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 500)
    }
  }

  const handleClose = () => {
    reset()
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0 bg-[var(--bg-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">회원가입</h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* 내용 - 스크롤 가능 */}
        <div className="overflow-y-auto flex-1 modal-scroll">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  이메일
                </label>
                <input
                  id="signup-email"
                  type="email"
                  {...register('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '올바른 이메일 형식을 입력해주세요'
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.email ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="이메일을 입력하세요"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-nickname" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  닉네임
                </label>
                <input
                  id="signup-nickname"
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
                  className={`w-full px-4 py-2.5 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.nickname ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="닉네임을 입력하세요"
                />
                {errors.nickname && <p className="mt-1.5 text-xs text-red-500">{errors.nickname.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  비밀번호
                </label>
                <input
                  id="signup-password"
                  type="password"
                  {...register('password', {
                    required: '비밀번호를 입력해주세요',
                    minLength: {
                      value: 6,
                      message: '비밀번호는 최소 6자 이상이어야 합니다'
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.password ? 'border-red-500' : 'border-[var(--border-color)]'
                  }`}
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  {...register('confirmPassword', {
                    required: '비밀번호 확인을 입력해주세요',
                    validate: (value) => {
                      if (!value) {
                        return '비밀번호 확인을 입력해주세요'
                      }
                      if (password && value !== password) {
                        return '비밀번호가 일치하지 않습니다'
                      }
                      return true
                    }
                  })}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-primary)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] focus:border-transparent transition-all text-sm ${
                    errors.confirmPassword || (confirmPassword && password && confirmPassword !== password)
                      ? 'border-red-500'
                      : 'border-[var(--border-color)]'
                  }`}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {(errors.confirmPassword || (confirmPassword && password && confirmPassword !== password)) && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.confirmPassword?.message || '비밀번호가 일치하지 않습니다'}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-3 bg-[var(--accent-yellow)] text-black rounded-lg hover:opacity-90 active:opacity-80 transition-all font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
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
        </div>
      </div>
    </div>
  )
}

