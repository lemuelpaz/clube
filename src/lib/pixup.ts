// PixUp payment gateway client
// Docs: https://pixup.readme.io/reference/começando

const PIXUP_BASE = 'https://api.pixup.com.br'

export interface PixUpConfig {
  clientId: string
  clientSecret: string
  sandbox?: boolean
}

export interface PixChargeInput {
  amount: number // BRL
  externalId: string
  customer: { name: string; cpf: string; email: string }
  description?: string
  expirationSeconds?: number
}

export interface PixChargeResult {
  chargeId: string
  status: string
  qrCodeText: string   // EMV copia-e-cola
  qrCodeImage?: string // URL da imagem do QR
  expiresAt?: string
}

async function getAccessToken(config: PixUpConfig): Promise<string> {
  const res = await fetch(`${PIXUP_BASE}/criar-token-de-acesso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message ?? `PixUp auth error ${res.status}`)
  }
  const data = await res.json() as any
  return data.access_token ?? data.token
}

export async function createPixCharge(
  config: PixUpConfig,
  input: PixChargeInput,
): Promise<PixChargeResult> {
  const token = await getAccessToken(config)
  const res = await fetch(`${PIXUP_BASE}/create-qrcode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      valor: Math.round(input.amount * 100),
      external_id: input.externalId,
      descricao: input.description ?? 'Assinatura Clube Elite',
      expiracao: input.expirationSeconds ?? 3600,
      pagador: {
        nome: input.customer.name,
        cpf: input.customer.cpf.replace(/\D/g, ''),
        email: input.customer.email,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message ?? `PixUp charge error ${res.status}`)
  }
  const data = await res.json() as any
  return {
    chargeId: data.id ?? data.txid ?? data.transaction_id,
    status: data.status ?? 'PENDING',
    qrCodeText: data.qr_code ?? data.emv ?? data.copia_e_cola ?? data.brcode,
    qrCodeImage: data.qr_code_url ?? data.imagem_qrcode ?? data.pix_link,
    expiresAt: data.expiracao ?? data.expires_at,
  }
}

export async function getPixChargeStatus(
  config: PixUpConfig,
  chargeId: string,
): Promise<{ status: string; paid: boolean }> {
  const token = await getAccessToken(config)
  const res = await fetch(`${PIXUP_BASE}/transactions/${chargeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { status: 'UNKNOWN', paid: false }
  const data = await res.json() as any
  const status: string = data.status ?? 'PENDING'
  const paid = ['PAID', 'APPROVED', 'CONCLUIDA', 'PAGO'].includes(status.toUpperCase())
  return { status, paid }
}
