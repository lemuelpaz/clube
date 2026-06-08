import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return Response.json({ error: 'Email obrigatório' }, { status: 400 })

  // Always return success to avoid user enumeration
  const user = await db.getUserByEmail(email)
  if (!user) return Response.json({ success: true })

  const cfg = await db.getSmtpConfig()
  if (!cfg) return Response.json({ error: 'Serviço de e-mail não configurado. Contate o suporte.' }, { status: 503 })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 3_600_000).toISOString() // 1 hour

  await db.createPasswordResetToken(token, user.id, expiresAt)

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'
  const resetUrl = `${origin}/reset-password?token=${token}`

  try {
    await sendPasswordResetEmail(cfg, { to: user.email, name: user.name, resetUrl })
  } catch (err: any) {
    console.error('Failed to send reset email:', err)
    return Response.json({ error: 'Erro ao enviar e-mail. Tente novamente mais tarde.' }, { status: 502 })
  }

  return Response.json({ success: true })
}
