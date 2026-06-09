import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await db.getUserByEmail(credentials.email)
          if (!user) { console.error('[auth] user not found:', credentials.email); return null }

          if (user.status === 'BANNED' || user.status === 'SUSPENDED') return null

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) { console.error('[auth] wrong password for:', credentials.email); return null }

          await db.updateUser(user.id, { lastSeen: new Date().toISOString() }).catch(() => {})

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            verified: user.verified,
          } as any
        } catch (err: any) {
          console.error('[auth] authorize error:', err?.message ?? err)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.verified = (user as any).verified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).verified = token.verified
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET ?? 'clube-secret-key-2024-change-in-prod',
}
