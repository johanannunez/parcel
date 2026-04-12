# Information Security Policy

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Effective Date** | 2026-04-12 |
| **Last Reviewed** | 2026-04-12 |
| **Owner** | Johan Annunez, The Parcel Company |

---

## 1. Purpose and Scope

This policy defines the security standards and practices that The Parcel Company follows to protect business data, customer information, and financial records. It applies to all systems, services, and data used in running the business.

The Parcel Company is a sole-operator property management company. All systems are managed by the owner. This policy covers the production web application, its supporting infrastructure (Supabase, Vercel, Plaid, Stripe), and all business data processed through these systems.

## 2. Data Classification

All data handled by The Parcel Company falls into one of three tiers:

**Public:** Marketing website content, help center articles, and any information intentionally published on theparcelco.com. No special handling required.

**Internal:** Business operations data, property details, owner contact information, booking records, and internal communications. Access restricted to authenticated admin and authorized property owners (via their own portal, limited to their own data).

**Confidential:** Financial data (bank account numbers, routing numbers, balances, transaction history), Plaid access tokens, authentication credentials, encryption keys, and API secrets. This data requires encryption at rest and in transit, strict access controls, and audit logging.

## 3. Encryption Standards

**At rest:**

- Plaid access tokens are encrypted using AES-256-GCM before storage in Supabase. The encryption key (`TREASURY_ENCRYPTION_KEY`) is stored in Doppler, never in source code.
- Supabase enforces encryption at rest for all stored data using transparent disk encryption.

**In transit:**

- All connections use TLS 1.2 or higher.
- HTTPS is enforced on all public endpoints via Vercel.
- Connections to Supabase, Plaid, and Stripe APIs all use TLS.

## 4. Access Control

Access to systems and data follows the principle of least privilege. The full access model is defined in the companion Access Control Policy.

Key points:

- Single admin operator with full system access.
- Property owners access only their own data through a portal protected by Row Level Security.
- Multi-factor authentication (MFA) is required for Treasury access and all internal systems (Supabase, Vercel, GitHub, Doppler, Plaid, Stripe, Relay, Google Workspace).

## 5. Authentication

**User authentication** is handled by Supabase Auth using email and password.

**Treasury access** requires additional verification: a password re-confirmation step plus TOTP (time-based one-time password) MFA. Treasury sessions time out after 15 minutes of inactivity. Standard admin sessions follow Supabase default session durations.

**Internal systems** (Supabase Dashboard, Vercel, GitHub, Doppler, Plaid Dashboard, Stripe Dashboard, Relay, Google Workspace) all require MFA enabled on the admin account.

## 6. Vulnerability Management

**Dependency monitoring:**

- GitHub Dependabot monitors all dependencies for known vulnerabilities and opens pull requests for updates automatically.
- CodeQL runs static analysis on each pull request to detect security issues in application code.
- `pnpm audit` runs as part of the CI pipeline on every pull request.

**Remediation timelines:**

| Severity | Resolution Deadline |
|----------|-------------------|
| Critical | 48 hours |
| High | 7 days |
| Medium | 30 days |
| Low | Next scheduled release |

## 7. Incident Response

If a security incident is suspected or confirmed, the following steps apply. As a sole-operator business, all steps are handled by the owner.

1. **Identify:** Determine the nature and scope of the incident. Check logs in Supabase, Vercel, and Plaid for unusual activity.
2. **Contain:** Revoke compromised credentials immediately. Rotate affected API keys. Disable compromised user accounts. If financial data is involved, pause Plaid connections.
3. **Eradicate:** Remove the root cause. Patch the vulnerability or close the attack vector.
4. **Recover:** Restore normal operations. Re-enable services with fresh credentials. Verify data integrity.
5. **Document:** Record what happened, when, what was affected, and what was done to resolve it. Store the incident report in the project repository.

If financial data (bank accounts, Plaid tokens, transaction records) is compromised, contact Plaid support immediately in addition to the steps above.

## 8. Data Retention and Deletion

| Data Type | Retention Period |
|-----------|-----------------|
| Transaction data | 7 years |
| Audit logs | 7 years |
| Alerts and forecasts | 1 year |
| Inactive subscription records | 90 days |

A monthly automated purge job (cron) removes data that has exceeded its retention period. The purge job logs what was deleted and when.

When an owner requests account deletion, all of their personal data is removed within 30 days. Anonymized transaction records required for tax or legal compliance are retained for the full 7-year period.

## 9. Change Management

All changes to the production application follow this process:

1. Code changes are made on a feature branch in the GitHub repository.
2. A pull request is opened for review.
3. CI checks must pass: build, lint, and `pnpm audit`.
4. The pull request is merged into the `main` branch.
5. Vercel automatically deploys the `main` branch to production.

No code reaches production without passing through this pipeline. Direct pushes to `main` are discouraged; pull requests are the standard path.

Database schema changes follow a separate workflow: SQL is batched, reviewed, and applied manually through the Supabase SQL Editor with documentation in the project's migration history.

## 10. Policy Review

This policy is reviewed at least once per year, or immediately following any security incident.

| Review Event | Date |
|-------------|------|
| Initial publication | 2026-04-12 |
| Next scheduled review | 2027-04-12 |
