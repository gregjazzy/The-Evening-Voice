import Stripe from 'stripe'

// Server-side Stripe client — only import this in API routes
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

// Re-export shared config
export { CREDIT_PACKS, getCreditPack, type CreditPackId } from './stripe-config'
export { NARRATION_CREDIT_PACKS, getNarrationCreditPack, type NarrationCreditPackId } from './stripe-config'
