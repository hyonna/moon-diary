import 'next-auth'
import { JWTToken, SessionUser } from '@/lib/auth'

declare module 'next-auth' {
  interface Session {
    user: SessionUser
  }

  interface User extends SessionUser {
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends JWTToken {}
}

