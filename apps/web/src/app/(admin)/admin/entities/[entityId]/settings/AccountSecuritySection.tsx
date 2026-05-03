"use client";

import { LockKey, DeviceMobile, DesktopTower, SignOut } from "@phosphor-icons/react";
import s from "./PersonalInfoSection.module.css";
import x from "./SettingsShared.module.css";

export type SessionRow = {
  id: string;
  loggedInAt: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  country: string | null;
};

type Props = {
  email: string;
  twoFactorEnabled: boolean;
  lastPasswordChangeAt: string | null;
  sessions: SessionRow[];
};

export function AccountSecuritySection({
  email,
  twoFactorEnabled,
  lastPasswordChangeAt,
  sessions,
}: Props) {
  return (
    <div>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Account &amp; security</h2>
        <p className={s.sectionSubtitle}>
          Sign-in details, multi-factor, and active sessions for this owner.
        </p>
      </header>

      {/* Email + password */}
      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Sign-in</span>
        </div>
        <div className={s.cardBody}>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Email address</label>
              <span className={s.labelHint}>Used for login + all mail.</span>
            </div>
            <div className={s.fieldCell}>
              <div className={s.emailWrap}>
                <input className={s.input} type="email" value={email} readOnly />
                <button type="button" className={s.btnSecondary}>
                  Change email
                </button>
              </div>
              <p className={s.fieldHint}>
                Triggers a verification flow sent to the new address.
              </p>
            </div>
          </div>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Password</label>
              <span className={s.labelHint}>
                {lastPasswordChangeAt
                  ? `Last changed ${formatDate(lastPasswordChangeAt)}`
                  : "Never changed since signup."}
              </span>
            </div>
            <div className={s.fieldCell}>
              <button type="button" className={s.btnSecondary}>
                <LockKey size={14} weight="duotone" /> Send reset link
              </button>
              <p className={s.fieldHint}>
                Owner gets a one-time magic link to set a new password.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-factor */}
      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Two-factor authentication</span>
        </div>
        <div className={s.cardBody}>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Authenticator app</label>
              <span className={s.labelHint}>TOTP via Google / 1Password / Authy.</span>
            </div>
            <div className={s.fieldCell} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {twoFactorEnabled ? (
                <>
                  <span className={`${x.pill} ${x.pillGreen}`}>Enabled</span>
                  <button type="button" className={s.btnSecondary}>
                    Reset 2FA
                  </button>
                </>
              ) : (
                <>
                  <span className={`${x.pill} ${x.pillSlate}`}>Not set up</span>
                  <button type="button" className={s.btnSecondary}>
                    Send enrollment link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Active sessions */}
      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Active sessions</span>
        </div>
        <p className={s.cardHeaderSub}>
          Recent sign-ins tied to this owner&rsquo;s account.
        </p>
        <ul className={x.list}>
          {sessions.length === 0 ? (
            <li className={x.listItem}>
              <div className={x.listItemMain}>
                <div className={x.listItemTitle}>No sessions on record yet.</div>
                <div className={x.listItemSub}>
                  Appears here after the owner signs in for the first time.
                </div>
              </div>
            </li>
          ) : (
            sessions.map((sess, i) => {
              const Icon =
                sess.deviceType === "mobile" ? DeviceMobile : DesktopTower;
              return (
                <li key={sess.id} className={x.listItem}>
                  <div className={x.listItemIcon}>
                    <Icon size={16} weight="duotone" />
                  </div>
                  <div className={x.listItemMain}>
                    <div className={x.listItemTitle}>
                      {sess.browser ?? "Browser"}
                      {sess.os ? ` · ${sess.os}` : ""}
                      {i === 0 ? (
                        <span
                          className={`${x.pill} ${x.pillGreen}`}
                          style={{ marginLeft: 8 }}
                        >
                          Current
                        </span>
                      ) : null}
                    </div>
                    <div className={x.listItemSub}>
                      <span>{formatDate(sess.loggedInAt)}</span>
                      {(sess.city || sess.country) && (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {[sess.city, sess.country].filter(Boolean).join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={x.listItemAction}>
                    <button type="button" className={s.btnGhost}>
                      Sign out
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
        <div className={s.cardFooter}>
          <p className={s.cardFooterHint}>
            Signing out remote sessions forces the owner to sign back in on those devices.
          </p>
          <button type="button" className={s.btnSecondary}>
            <SignOut size={14} weight="duotone" /> Sign out of all other sessions
          </button>
        </div>
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
