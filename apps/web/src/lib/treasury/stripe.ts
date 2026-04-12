// Stripe client singleton
// SERVER-SIDE ONLY — never import this from client components

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Returns a singleton Stripe client.
 * Reads STRIPE_SECRET_KEY from env.
 */
export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}
