/**
 * Branded Parcel email template.
 * Wraps rich HTML content from the Tiptap editor in a clean,
 * email-client-safe template matching the Parcel brand.
 */

const BRAND_BLUE = "#02AAEB";
const BRAND_DARK = "#1B77BE";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#6b7280";
const BG_LIGHT = "#fafafa";
const PORTAL_URL = "https://www.theparcelco.com";

export function buildMessageEmail(args: {
  subject: string;
  body: string;
  conversationId?: string;
  ownerName?: string;
}) {
  const portalLink = args.conversationId
    ? `${PORTAL_URL}/portal/messages`
    : `${PORTAL_URL}/portal/messages`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(args.subject)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BG_LIGHT}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { padding: 32px 40px 24px; border-bottom: 1px solid #f0eeec; }
    .logo { font-size: 20px; font-weight: 700; color: ${TEXT_PRIMARY}; text-decoration: none; letter-spacing: -0.3px; }
    .logo-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: ${BRAND_BLUE}; margin-left: 8px; vertical-align: baseline; }
    .body-wrap { padding: 32px 40px; }
    .greeting { font-size: 14px; color: ${TEXT_SECONDARY}; margin: 0 0 20px; }
    .content { font-size: 15px; line-height: 1.7; color: ${TEXT_PRIMARY}; }
    .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
    .content a { color: ${BRAND_DARK}; }
    .content h1 { font-size: 22px; margin: 20px 0 8px; }
    .content h2 { font-size: 18px; margin: 16px 0 8px; }
    .content h3 { font-size: 16px; margin: 14px 0 6px; }
    .content blockquote { border-left: 3px solid ${BRAND_BLUE}; margin: 12px 0; padding: 4px 16px; color: ${TEXT_SECONDARY}; }
    .content ul, .content ol { padding-left: 20px; }
    .cta-wrap { padding: 24px 40px 32px; text-align: center; }
    .cta-btn { display: inline-block; padding: 12px 28px; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0eeec; text-align: center; }
    .footer p { font-size: 12px; color: ${TEXT_SECONDARY}; margin: 4px 0; line-height: 1.5; }
    .footer a { color: ${BRAND_DARK}; text-decoration: none; }
    @media (max-width: 620px) {
      .header, .body-wrap, .cta-wrap, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  <div style="padding: 20px 0; background-color: ${BG_LIGHT};">
    <div class="container" style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div class="header">
        <a href="${PORTAL_URL}" class="logo" style="color: ${TEXT_PRIMARY}; text-decoration: none;">
          Parcel<span class="logo-badge" style="color: ${BRAND_BLUE}; margin-left: 8px;">Owner Portal</span>
        </a>
      </div>

      <!-- Body -->
      <div class="body-wrap">
        ${args.ownerName ? `<p class="greeting">Hi ${escapeHtml(args.ownerName)},</p>` : ""}
        <div class="content">
          ${args.body}
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${portalLink}" class="cta-btn" style="color: #ffffff; background-color: ${BRAND_BLUE}; text-decoration: none;">
          View in your Parcel portal
        </a>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This message was sent from your <a href="${PORTAL_URL}">Parcel Owner Portal</a>.</p>
        <p>The Parcel Company &middot; Rentals Made Easy</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildBroadcastEmail(args: {
  subject: string;
  body: string;
  ownerName?: string;
}) {
  return buildMessageEmail({
    ...args,
    conversationId: undefined,
  });
}

const ADMIN_URL = "https://www.theparcelco.com/admin";

export function buildFollowUpDigestEmail(args: {
  contacts: Array<{
    id: string;
    fullName: string;
    email: string | null;
    followUpAt: string;
    daysOverdue: number;
  }>;
}) {
  const count = args.contacts.length;
  const subject = `Follow-up reminders — ${count} contact${count === 1 ? "" : "s"} need attention`;

  const rows = args.contacts
    .map((c) => {
      const isOverdue = c.daysOverdue > 0;
      const dateLabel = isOverdue
        ? `${c.daysOverdue}d overdue`
        : "Due today";
      const badgeBg = isOverdue ? "#fef2f2" : "#fff7ed";
      const badgeColor = isOverdue ? "#b91c1c" : "#92600a";
      const badgeBorder = isOverdue ? "#fecaca" : "#fde68a";
      const detailUrl = `${ADMIN_URL}/clients/${c.id}`;

      return `
      <tr style="border-bottom: 1px solid #f0eeec;">
        <td style="padding: 12px 16px; vertical-align: middle;">
          <a href="${detailUrl}" style="font-size: 14px; font-weight: 600; color: ${BRAND_DARK}; text-decoration: none;">${escapeHtml(c.fullName)}</a>
          ${c.email ? `<div style="font-size: 12px; color: ${TEXT_SECONDARY}; margin-top: 2px;">${escapeHtml(c.email)}</div>` : ""}
        </td>
        <td style="padding: 12px 16px; vertical-align: middle; font-size: 12px; color: ${TEXT_SECONDARY}; white-space: nowrap;">
          ${escapeHtml(new Date(c.followUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))}
        </td>
        <td style="padding: 12px 16px; vertical-align: middle;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">${dateLabel}</span>
        </td>
        <td style="padding: 12px 16px; vertical-align: middle; text-align: right;">
          <a href="${detailUrl}" style="font-size: 12px; font-weight: 600; color: ${BRAND_DARK}; text-decoration: none;">View &rarr;</a>
        </td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_LIGHT}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="padding: 20px 0; background-color: ${BG_LIGHT};">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">

      <div style="padding: 28px 40px 20px; border-bottom: 1px solid #f0eeec;">
        <a href="${ADMIN_URL}" style="font-size: 20px; font-weight: 700; color: ${TEXT_PRIMARY}; text-decoration: none; letter-spacing: -0.3px;">
          Parcel<span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: ${BRAND_BLUE}; margin-left: 8px;">Admin</span>
        </a>
      </div>

      <div style="padding: 28px 40px 8px;">
        <h2 style="margin: 0 0 6px; font-size: 18px; font-weight: 700; color: ${TEXT_PRIMARY}; letter-spacing: -0.3px;">Follow-up reminders</h2>
        <p style="margin: 0 0 20px; font-size: 14px; color: ${TEXT_SECONDARY};">${count} contact${count === 1 ? "" : "s"} ${count === 1 ? "needs" : "need"} follow-up today.</p>
      </div>

      <div style="padding: 0 40px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #f0eeec; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #fafafa; border-bottom: 1px solid #f0eeec;">
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${TEXT_SECONDARY};">Contact</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${TEXT_SECONDARY};">Follow-up date</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${TEXT_SECONDARY};">Status</th>
              <th style="padding: 10px 16px;"></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="padding: 24px 40px; text-align: center;">
        <a href="${ADMIN_URL}/clients" style="display: inline-block; padding: 11px 24px; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Open admin dashboard</a>
      </div>

      <div style="padding: 20px 40px; border-top: 1px solid #f0eeec; text-align: center;">
        <p style="font-size: 12px; color: ${TEXT_SECONDARY}; margin: 0;">Daily follow-up digest from <a href="${ADMIN_URL}" style="color: ${BRAND_DARK}; text-decoration: none;">Parcel</a>.</p>
      </div>

    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
