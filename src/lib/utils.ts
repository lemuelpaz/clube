import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInYears, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: string): number {
  return differenceInYears(new Date(), new Date(birthDate))
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const PLAN_NAMES: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
}

export const PLAN_PRICES: Record<string, number> = {
  MONTHLY: 149.90,
  QUARTERLY: 399.90,
  SEMIANNUAL: 699.90,
  ANNUAL: 1199.90,
}

export const PLAN_DURATIONS: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMIANNUAL: 180,
  ANNUAL: 365,
}

export const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
  let r = (s * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
  r = (s * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

export function isOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

export const INTERESTS = [
  'Viagens', 'Gastronomia', 'Arte', 'Música', 'Esportes', 'Tecnologia',
  'Moda', 'Literatura', 'Cinema', 'Negócios', 'Yoga', 'Vinhos', 'Fotografia',
  'Natureza', 'Teatro', 'Culinária', 'Dança', 'Golf', 'Tênis', 'Surf'
]
