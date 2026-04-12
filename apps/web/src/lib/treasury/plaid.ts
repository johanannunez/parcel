// Plaid API client singleton
// SERVER-SIDE ONLY — never import this from client components

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

export const PLAID_PRODUCTS: Products[] = [Products.Transactions];

export const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us];

let plaidClient: PlaidApi | null = null;

/**
 * Returns a singleton Plaid API client.
 * Reads PLAID_CLIENT_ID, PLAID_SB_SECRET, and PLAID_ENV (default: 'sandbox') from env.
 */
export function getPlaidClient(): PlaidApi {
  if (plaidClient) return plaidClient;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SB_SECRET;
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;

  if (!clientId) throw new Error('PLAID_CLIENT_ID is not set');
  if (!secret) throw new Error('PLAID_SB_SECRET is not set');

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
