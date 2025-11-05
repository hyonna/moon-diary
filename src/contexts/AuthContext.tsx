'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { SessionUser } from '@/lib/auth'

interface UserProfile {
  id: string
  email: string
  nickname: string
}

interface AuthContextType {
  user: SessionUser | null
  profile: UserProfile | null
  session: any // NextAuth session
  loading: boolean
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  updateNickname: (newNickname: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const loading = status === 'loading'

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // 네트워크/서버 에러만 로그, 단순 미존재는 maybeSingle로 에러가 아님
        console.error('Error fetching profile:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }

  // NextAuth 세션이 변경될 때 프로필 정보 업데이트
  useEffect(() => {
    if (session?.user) {
      fetchProfile(session.user.id).then((p) => {
        if (p) {
          setProfile(p)
        } else {
          // 프로필이 아직 없을 때는 세션 정보를 임시 표시
          setProfile({
            id: session.user.id,
            email: session.user.email,
            nickname: session.user.nickname,
          })
        }
      })
    } else {
      setProfile(null)
    }
  }, [session])

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      // 1. 회원가입 (메타데이터에 닉네임 포함)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname
          }
        }
      })

      if (error) {
        return { error }
      }

      // 2. 프로필 생성 (트리거가 자동으로 생성하지만, 세션이 있으면 즉시 생성)
      if (data.user) {
        // 세션이 있으면 프로필 생성 시도
        if (data.session) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: email,
              nickname: nickname,
            })

          // 프로필 생성 실패해도 트리거가 생성하므로 에러 무시 (로그만 남김)
          if (profileError) {
            console.warn('Profile creation failed, but trigger will handle it:', profileError)
          }

          // 3. NextAuth.js 세션 생성 (자동 로그인)
          await nextAuthSignIn('credentials', {
            email,
            password,
            redirect: false,
          })

          // 프로필 정보 로드 (트리거가 생성했을 수 있으므로 잠시 대기 후 재시도)
          setTimeout(async () => {
            const userProfile = await fetchProfile(data.user.id)
            if (userProfile) {
              setProfile(userProfile)
            }
          }, 500)
        }
        // 세션이 없으면 (이메일 인증 필요) 트리거가 프로필을 생성함
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // 에러 메시지 파싱
        let errorMessage = '로그인에 실패했습니다.'
        if (result.error === 'CredentialsSignin') {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (result.error.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else {
          errorMessage = result.error
        }
        return { error: new Error(errorMessage) }
      }

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        return { error }
      }
      return { error: new Error('로그인 중 오류가 발생했습니다.') }
    }
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    // Supabase 세션도 함께 로그아웃
    await supabase.auth.signOut()
    setProfile(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  }

  const updateNickname = async (newNickname: string) => {
    if (!user) {
      return { error: new Error('로그인이 필요합니다.') }
    }

    try {
      const trimmedNickname = newNickname.trim()
      
      if (!trimmedNickname) {
        return { error: new Error('닉네임을 입력해주세요.') }
      }

      if (trimmedNickname.length > 20) {
        return { error: new Error('닉네임은 최대 20자까지 입력 가능합니다.') }
      }

      // user_profiles 테이블 업데이트
      const { error } = await supabase
        .from('user_profiles')
        .update({ nickname: trimmedNickname })
        .eq('id', user.id)

      if (error) {
        return { error }
      }

      // 프로필 정보 새로고침
      const updatedProfile = await fetchProfile(user.id)
      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      return { error: null }
    } catch (error) {
      if (error instanceof Error) {
        return { error }
      }
      return { error: new Error('닉네임 변경 중 오류가 발생했습니다.') }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }

  const user = session?.user || null

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateNickname,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

