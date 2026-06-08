import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateId, validateCPF } from '@/lib/utils'
import type { User } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, phone, birthDate, city, state, role, bio, interests, cpf, sugarProfile } = body

    if (!email || !password || !name || !role) {
      return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    if (!cpf) {
      return Response.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const cleanCpf = cpf.replace(/\D/g, '')
    if (!validateCPF(cleanCpf)) {
      return Response.json({ error: 'CPF inválido' }, { status: 400 })
    }

    const existing = await db.getUserByEmail(email)
    if (existing) {
      return Response.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const existingCpf = await db.getUserByCpf(cleanCpf)
    if (existingCpf) {
      return Response.json({ error: 'CPF já cadastrado' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    const user: User = {
      id: generateId(),
      email: email.toLowerCase(),
      password: hashed,
      name,
      cpf: cleanCpf,
      phone,
      birthDate,
      city,
      state,
      role,
      status: 'ACTIVE',
      verified: false,
      photos: [],
      bio,
      interests: interests ?? [],
      sugarProfile: role === 'FEMALE' ? sugarProfile : undefined,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    }

    await db.createUser(user)

    const { password: _p, ...safe } = user
    return Response.json({ user: safe }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
