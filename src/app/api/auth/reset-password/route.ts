import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password)
    return Response.json({ error: 'Token e senha são obrigatórios' }, { status: 400 })

  if (password.length < 6)
    return Response.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })

  const record = await db.getPasswordResetToken(token)
  if (!record)
    return Response.json({ error: 'Link inválido ou expirado' }, { status: 400 })

  if (record.used)
    return Response.json({ error: 'Este link já foi utilizado' }, { status: 400 })

  if (new Date(record.expires_at) < new Date())
    return Response.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  await db.updateUser(record.user_id, { password: hashed })
  await db.markPasswordResetTokenUsed(token)

  return Response.json({ success: true })
}
