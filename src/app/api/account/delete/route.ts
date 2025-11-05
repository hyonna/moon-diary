import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function DELETE() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin 클라이언트 준비
    const supabaseAdmin = getSupabaseAdmin()

    // 1) 사용자 프로필 삭제 (RLS 무시를 위해 admin 클라이언트 사용)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // 2) Auth 사용자 삭제
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // 응답과 함께 NextAuth 세션 쿠키 만료 처리 (클라이언트 signOut과 병행)
    const res = NextResponse.json({ ok: true })
    const cookieNames = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ]
    cookieNames.forEach((name) => {
      res.cookies.set(name, '', { maxAge: 0, path: '/' })
    })
    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    // 환경 변수 미설정 시 가이드를 제공
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({
        error: '서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 환경변수를 설정한 뒤 다시 시도해주세요.'
      }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


