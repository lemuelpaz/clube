import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { User, Subscription, Verification, Match, Message } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const users = await db.getUsers()

  // Only seed if empty
  if (users.length > 0) {
    return Response.json({ message: 'Banco já foi populado' })
  }

  const now = new Date().toISOString()
  const adminPass = await bcrypt.hash('admin123', 10)
  const malePass = await bcrypt.hash('senha123', 10)
  const femalePass = await bcrypt.hash('senha123', 10)

  const admin: User = {
    id: generateId(), email: 'admin@clubeelite.com', password: adminPass,
    name: 'Administrador', role: 'ADMIN', status: 'ACTIVE', verified: true,
    photos: [], interests: [], balance: 0, createdAt: now, updatedAt: now,
  }

  const male1: User = {
    id: generateId(), email: 'carlos@email.com', password: malePass,
    name: 'Carlos Mendonça', phone: '11999990001', birthDate: '1988-05-15',
    city: 'São Paulo', state: 'SP', role: 'MALE', status: 'ACTIVE', verified: false,
    photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
    bio: 'Empresário, amante de viagens e gastronomia. Busco conexões genuínas.',
    interests: ['Viagens', 'Gastronomia', 'Negócios', 'Golf'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  const female1: User = {
    id: generateId(), email: 'ana@email.com', password: femalePass,
    name: 'Ana Luiza', phone: '11999990002', birthDate: '1995-03-22',
    city: 'São Paulo', state: 'SP', role: 'FEMALE', status: 'ACTIVE', verified: true,
    photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
    bio: 'Designer apaixonada por arte e moda. Amo viajar e conhecer culturas diferentes.',
    interests: ['Arte', 'Moda', 'Viagens', 'Fotografia'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  const female2: User = {
    id: generateId(), email: 'beatriz@email.com', password: femalePass,
    name: 'Beatriz Oliveira', phone: '11999990003', birthDate: '1992-08-10',
    city: 'Rio de Janeiro', state: 'RJ', role: 'FEMALE', status: 'ACTIVE', verified: true,
    photos: ['https://randomuser.me/api/portraits/women/68.jpg'],
    bio: 'Advogada, apaixonada por literatura e cinema. Busco conversas inteligentes.',
    interests: ['Literatura', 'Cinema', 'Teatro', 'Vinhos'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  const female3: User = {
    id: generateId(), email: 'camila@email.com', password: femalePass,
    name: 'Camila Santos', birthDate: '1997-11-05',
    city: 'Belo Horizonte', state: 'MG', role: 'FEMALE', status: 'ACTIVE', verified: true,
    photos: ['https://randomuser.me/api/portraits/women/17.jpg'],
    bio: 'Médica, amo esportes e culinária saudável. Procuro alguém com objetivos de vida.',
    interests: ['Esportes', 'Culinária', 'Yoga', 'Natureza'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  const female4: User = {
    id: generateId(), email: 'daniela@email.com', password: femalePass,
    name: 'Daniela Ferreira', birthDate: '1993-06-18',
    city: 'São Paulo', state: 'SP', role: 'FEMALE', status: 'ACTIVE', verified: true,
    photos: ['https://randomuser.me/api/portraits/women/26.jpg'],
    bio: 'Empresária no setor de moda. Vivo entre São Paulo e Milão. Apaixonada por cultura.',
    interests: ['Moda', 'Viagens', 'Gastronomia', 'Arte'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  const female5: User = {
    id: generateId(), email: 'elena@email.com', password: femalePass,
    name: 'Elena Costa', birthDate: '1990-01-30',
    city: 'Curitiba', state: 'PR', role: 'FEMALE', status: 'ACTIVE', verified: false,
    photos: ['https://randomuser.me/api/portraits/women/55.jpg'],
    bio: 'Arquiteta. Aprecio bom design, viagens e momentos únicos.',
    interests: ['Arte', 'Música', 'Viagens', 'Dança'],
    balance: 0, lastSeen: now, createdAt: now, updatedAt: now,
  }

  // Create all users in parallel
  await Promise.all([admin, male1, female1, female2, female3, female4, female5].map(u => db.createUser(u)))

  // Subscription for male1
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)
  const sub1: Subscription = {
    id: generateId(), userId: male1.id, plan: 'MONTHLY',
    status: 'ACTIVE', startDate: now, endDate: endDate.toISOString(),
    amount: 149.90, paymentMethod: 'credit_card', createdAt: now,
  }

  // Verifications
  const verif1: Verification = {
    id: generateId(), userId: female1.id,
    documentUrl: 'https://via.placeholder.com/300x200?text=Documento',
    selfieUrl: 'https://via.placeholder.com/300x300?text=Selfie',
    status: 'APPROVED', createdAt: now, reviewedAt: now,
  }
  const verif2: Verification = {
    id: generateId(), userId: female5.id,
    documentUrl: 'https://via.placeholder.com/300x200?text=Documento',
    selfieUrl: 'https://via.placeholder.com/300x300?text=Selfie',
    status: 'PENDING', createdAt: now,
  }

  // Match between male1 and female1
  const match1: Match = {
    id: generateId(), user1Id: male1.id, user2Id: female1.id, createdAt: now,
  }

  const msgExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const msg1: Message = {
    id: generateId(), matchId: match1.id, senderId: female1.id,
    content: 'Oi! Vi seu perfil e achei muito interessante 😊', read: false,
    createdAt: now, expiresAt: msgExpiry,
  }
  const msg2: Message = {
    id: generateId(), matchId: match1.id, senderId: male1.id,
    content: 'Olá Ana! Muito prazer. Vi que você curte viagens também!', read: true,
    createdAt: now, expiresAt: msgExpiry,
  }

  await Promise.all([
    db.createSubscription(sub1),
    db.createVerification(verif1),
    db.createVerification(verif2),
    db.createMatch(match1),
  ])

  await Promise.all([
    db.createMessage(msg1),
    db.createMessage(msg2),
  ])

  return Response.json({
    message: 'Banco populado com sucesso!',
    credentials: {
      admin: { email: 'admin@clubeelite.com', password: 'admin123' },
      homem: { email: 'carlos@email.com', password: 'senha123' },
      mulher: { email: 'ana@email.com', password: 'senha123' },
    }
  })
}
