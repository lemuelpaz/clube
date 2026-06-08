import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { Verification } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const verif = await db.getVerificationByUserId(userId)
  return Response.json({ verification: verif })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role !== 'FEMALE') {
    return Response.json({ error: 'Apenas mulheres precisam de verificação' }, { status: 403 })
  }

  const existing = await db.getVerificationByUserId(userId)
  if (existing && existing.status === 'PENDING') {
    return Response.json({ error: 'Já existe uma verificação em andamento' }, { status: 409 })
  }
  if (existing && existing.status === 'APPROVED') {
    return Response.json({ error: 'Perfil já verificado' }, { status: 409 })
  }

  const { documentUrl, selfieUrl } = await req.json()
  if (!documentUrl || !selfieUrl) {
    return Response.json({ error: 'Documento e selfie são obrigatórios' }, { status: 400 })
  }

  const verif: Verification = {
    id: generateId(), userId,
    documentUrl, selfieUrl,
    status: 'PENDING', createdAt: new Date().toISOString(),
  }

  await db.createVerification(verif)
  return Response.json({ verification: verif }, { status: 201 })
}
