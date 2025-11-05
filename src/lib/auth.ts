import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import type { NextAuthConfig } from 'next-auth'

// JWT 토큰 타입 정의
export interface JWTToken {
  id: string
  email: string
  nickname: string
  accessToken?: string
}

// 세션 타입 정의
export interface SessionUser {
  id: string
  email: string
  nickname: string
}

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 초기 로그인 시
      if (user) {
        token.id = user.id
        token.email = user.email
        token.nickname = user.nickname
        if ('accessToken' in user) {
          token.accessToken = user.accessToken
        }
      }
      
      // 세션 갱신 시 Supabase에서 최신 프로필 정보 가져오기
      if (token.id) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', token.id as string)
            .maybeSingle()

          if (profile) {
            token.email = profile.email
            token.nickname = profile.nickname
          }
        } catch (error) {
          console.error('Error fetching profile in JWT callback:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.nickname = token.nickname as string
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        try {
          // Supabase로 로그인
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          })

          if (error) {
            throw new Error(error.message || '로그인에 실패했습니다.')
          }

          if (!data.user) {
            throw new Error('사용자 정보를 찾을 수 없습니다.')
          }

          // 프로필 정보 가져오기
          let { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()

          // 프로필이 없으면 생성 (트리거가 작동하지 않은 경우 대비)
          if (!profile) {
            console.log('Profile not found, creating one...')
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || credentials.email as string,
                nickname: data.user.user_metadata?.nickname || data.user.email?.split('@')[0] || '사용자',
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              // RLS 정책 위반이면 트리거가 생성했을 수 있으므로 재시도
              const { data: retryProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle()
              
              if (!retryProfile) {
                throw new Error('프로필 생성에 실패했습니다.')
              }
              profile = retryProfile
            } else {
              profile = newProfile
            }
          }

          if (!profile) {
            throw new Error('프로필 정보를 가져올 수 없습니다.')
          }

          return {
            id: data.user.id,
            email: profile.email,
            nickname: profile.nickname,
            accessToken: data.session?.access_token,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          if (error instanceof Error) {
            throw error
          }
          throw new Error('로그인 중 오류가 발생했습니다.')
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  trustHost: true, // NextAuth.js v5에서 필요
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

