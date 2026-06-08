import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { WithdrawalRequest } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'FEMALE') return Response.json({ error: 'Apenas modelos' }, { status: 403 })

  const list = await db.getWithdrawalsByUser(user.id)
  return Response.json({ withdrawals: list })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'FEMALE') return Response.json({ error: 'Apenas modelos' }, { status: 403 })

  const body = await req.json()
  const { amount, bankDetails } = body

  if (!amount || amount <= 0)
    return Response.json({ error: 'Valor inválido' }, { status: 400 })
  if (!bankDetails?.holderName || !bankDetails?.holderCpf)
    return Response.json({ error: 'Dados bancários incompletos' }, { status: 400 })

  // Check balance
  const total = await db.getTotalEarnings(user.id)
  const pending = (await db.getWithdrawalsByUser(user.id))
    .filter(w => w.status === 'PENDING' || w.status === 'APPROVED')
    .reduce((s, w) => s + w.amount, 0)
  const available = total - pending

  if (amount > available)
    return Response.json({ error: 'Saldo insuficiente' }, { status: 400 })

  const w: WithdrawalRequest = {
    id: generateId(),
    userId: user.id,
    amount,
    status: 'PENDING',
    bankDetails,
    createdAt: new Date().toISOString(),
  }

  // Save bank details to user profile
  await db.updateUser(user.id, { bankDetails })

  await db.createWithdrawal(w)
  return Response.json({ withdrawal: w }, { status: 201 })
}
