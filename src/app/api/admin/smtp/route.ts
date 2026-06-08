import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createTransporter } from '@/lib/mail'
import type { SmtpConfig } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const cfg = await db.getSmtpConfig()
  if (!cfg) return Response.json({ config: null })
  return Response.json({
    config: { ...cfg, password: cfg.password ? '••••••••' : '' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN')
    return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { host, port, secure, user, password, fromEmail, fromName, test } = body

  if (!host || !port || !user || !fromEmail)
    return Response.json({ error: 'Host, porta, usuário e e-mail remetente são obrigatórios' }, { status: 400 })

  const existing = await db.getSmtpConfig()
  const finalPassword =
    password && password !== '••••••••' ? password : existing?.password ?? ''

  if (!finalPassword)
    return Response.json({ error: 'Senha do SMTP é obrigatória' }, { status: 400 })

  const cfg: SmtpConfig = {
    host, port: Number(port), secure: !!secure,
    user, password: finalPassword,
    fromEmail, fromName: fromName || 'Clube Elite',
    updatedAt: new Date().toISOString(),
  }

  // Test connection if requested
  if (test) {
    try {
      const transporter = createTransporter(cfg)
      await transporter.verify()
    } catch (err: any) {
      return Response.json({ error: `Falha na conexão: ${err.message}` }, { status: 400 })
    }
    return Response.json({ success: true, tested: true })
  }

  await db.saveSmtpConfig(cfg)
  return Response.json({ success: true })
}
