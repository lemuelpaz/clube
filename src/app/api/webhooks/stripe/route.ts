import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Stripe requires the raw body for signature verification
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }
  if (!sig) return new Response('Missing stripe-signature header', { status: 400 })

  const cfg = await db.getPaymentConfig()
  if (!cfg || cfg.provider !== 'STRIPE' || !cfg.clientSecret) {
    return new Response('Stripe not configured', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = new Stripe(cfg.clientSecret, { apiVersion: '2026-05-27.dahlia' })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature failed:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const sub = await db.getSubscriptionByChargeId(pi.id)
    if (sub && sub.status !== 'ACTIVE') {
      await db.updateSubscription(sub.id, { status: 'ACTIVE' })
    }
  }

  return new Response('ok', { status: 200 })
}
