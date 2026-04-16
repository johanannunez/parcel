// Plaid API client singleton
// SERVER-SIDE ONLY — never import this from client components

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

export const PLAID_PRODUCTS: Products[] = [Products.Transactions];

export const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us];

let plaidClient: PlaidApi | null = null;

/**
 * Returns a singleton Plaid API client.
 *
 * Env vars:
 *   PLAID_CLIENT_ID   — your Plaid client ID (same for all environments)
 *   PLAID_ENV         — "sandbox" | "production" (default: "sandbox")
 *   PLAID_SB_SECRET   — secret for sandbox
 *   PLAID_PROD_SECRET — secret for production
 */
export function getPlaidClient(): PlaidApi {
  if (plaidClient) return plaidClient;

  const clientId = process.env.PLAID_CLIENT_ID;
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  const secret = env === 'production'
    ? process.env.PLAID_PROD_SECRET
    : process.env.PLAID_SB_SECRET;

  if (!clientId) throw new Error('PLAID_CLIENT_ID is not set');
  if (!secret) {
    throw new Error(
      env === 'production'
        ? 'PLAID_PROD_SECRET is not set'
        : 'PLAID_SB_SECRET is not set',
    );
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  plaidClient = new PlaidApi(config);
  return plaidClient;
}
