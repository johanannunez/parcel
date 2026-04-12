# Access Control Policy

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Effective Date** | 2026-04-12 |
| **Last Reviewed** | 2026-04-12 |
| **Owner** | Johan Annunez, The Parcel Company |

---

## 1. Purpose and Scope

This policy defines who can access The Parcel Company's systems and data, what level of access each role receives, and how access is granted, reviewed, and revoked.

It applies to all users of the application, all internal systems, and all third-party services used to operate the business.

## 2. Roles

**Admin**

- Full access to the admin dashboard, Treasury, all API routes, and the database.
- Can view and manage all properties, all owners, all financial data, and all system settings.
- Currently limited to the sole operator (Johan Annunez).

**Owner (Property Owner)**

- Portal access only.
- Can view their own properties, bookings, calendar, payouts, and connections.
- Cannot see other owners' data.
- No access to financial data from Treasury, admin tools, or system settings.

## 3. Authentication Requirements

**All users:**

- Email and password authentication via Supabase Auth.

**Admin accessing Treasury:**

- Must re-confirm their password before entering Treasury.
- Must complete TOTP (time-based one-time password) verification.
- Treasury sessions expire after 15 minutes of inactivity.

**MFA on internal systems:**

MFA is enabled and required on all of the following services:

- Supabase Dashboard
- Vercel
- GitHub
- Doppler
- Plaid Dashboard
- Stripe Dashboard
- Relay (banking)
- Google Workspace

## 4. Authorization Model

**Row Level Security (RLS):**

Supabase Row Level Security is the primary mechanism for data isolation. Every database query runs through RLS policies that filter results to only the data the authenticated user is authorized to see. Owners can only read and modify their own records.

**Admin route protection:**

Admin routes are protected by three layers:

1. `proxy.ts` gate: checks the user's role before allowing the request to proceed.
2. `layout.tsx` verification: server-side role check at the layout level.
3. API route checks: each API route handler verifies admin role independently.

**Treasury protection:**

Treasury adds a fourth layer on top of admin checks: a re-authentication step requiring both password confirmation and TOTP verification.

**Owner portal:**

The portal relies on Supabase Auth for identity and RLS for authorization. Each query is scoped to the authenticated user's ID, so owners only see their own data without any additional application-level filtering.

## 5. API Key and Secret Management

**Storage:** All secrets are stored in Doppler, the project's secrets manager. No secrets are committed to the Git repository. No `.env` files containing real credentials are checked into version control.

**Plaid access tokens:** Encrypted with AES-256-GCM before being written to the database. The encryption key (`TREASURY_ENCRYPTION_KEY`) lives in Doppler and is never exposed to the client.

**Deployment flow:** Doppler syncs secrets to Vercel environment variables. This is the only path secrets take from storage to the running application.

**Key rotation:** `TREASURY_ENCRYPTION_KEY` is rotated annually. When rotated, all stored Plaid tokens are re-encrypted with the new key.

## 6. Principle of Least Privilege

**Service role client:** Used only on the server side for operations that need elevated access: webhook handlers, cron jobs, and admin-only queries. Never exposed to the browser.

**Anon key (public client):** Used for client-side requests. All data access through the anon key is governed by RLS policies. The anon key alone grants no special permissions.

**No shared accounts:** Each system has a single admin account belonging to the operator. No generic or shared credentials exist.

## 7. De-provisioning Checklist

The Parcel Company currently operates with a single person. This checklist is maintained for future use if employees or contractors are added and later leave.

When removing someone's access, complete every item:

- [ ] Disable their Supabase Auth account
- [ ] Remove them from the Vercel team
- [ ] Revoke their GitHub repository access
- [ ] Remove their Doppler access
- [ ] Remove them from the Plaid Dashboard
- [ ] Remove them from the Stripe Dashboard
- [ ] Revoke their Relay bank access
- [ ] Remove their Google Workspace account
- [ ] Confirm removal is logged with date and reason

## 8. Access Reviews

Access reviews happen quarterly, in January, April, July, and October.

Each review covers:

- All internal systems listed in Section 3: check for stale invitations or unused accounts.
- API keys across all services: verify none are expired, unused, or overly permissive.
- Supabase Auth user list: look for orphaned accounts (users who should have been removed).
- Doppler access list: confirm only authorized accounts have access.

Each completed review is logged with the date, findings, and any actions taken.

## 9. Policy Review

This policy is reviewed at least once per year, or immediately following any access-related incident.

| Review Event | Date |
|-------------|------|
| Initial publication | 2026-04-12 |
| Next scheduled review | 2027-04-12 |
