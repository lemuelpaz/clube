import Stripe from 'stripe'

function client(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: '2026-05-27.dahlia' })
}

export interface StripePixResult {
  chargeId: string
  qrCodeImage: string
  qrCodeText: string
  expiresAt: string
}

export async function createStripePixCharge(
  secretKey: string,
  opts: { amount: number; externalId: string; description: string; returnUrl: string },
): Promise<StripePixResult> {
  const stripe = client(secretKey)
  const pi = await stripe.paymentIntents.create({
    amount: Math.round(opts.amount * 100),
    currency: 'brl',
    payment_method_types: ['pix'],
    payment_method_data: { type: 'pix' },
    confirm: true,
    return_url: opts.returnUrl,
    metadata: { externalId: opts.externalId },
    payment_method_options: { pix: { expires_after_seconds: 3600 } },
    description: opts.description,
  })

  const pix = (pi as any).next_action?.pix_display_qr_code
  if (!pix) throw new Error('PIX QR code não disponível — verifique se PIX está habilitado na sua conta Stripe')

  return {
    chargeId: pi.id,
    qrCodeImage: pix.image_url_png ?? '',
    qrCodeText: pix.data ?? '',
    expiresAt: pix.expires_at
      ? new Date(pix.expires_at * 1000).toISOString()
      : new Date(Date.now() + 3_600_000).toISOString(),
  }
}

export async function getStripePixStatus(
  secretKey: string,
  paymentIntentId: string,
): Promise<{ paid: boolean; status: string }> {
  const stripe = client(secretKey)
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
  return { paid: pi.status === 'succeeded', status: pi.status }
}
