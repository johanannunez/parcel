"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { OwnerDetailData } from "@/lib/admin/owner-detail-types";
import { ImpersonationBanner } from "./settings/ImpersonationBanner";
import { PersonalInfoSection } from "./settings/PersonalInfoSection";
import { SectionPlaceholder } from "./settings/SectionPlaceholder";
import styles from "./SettingsTab.module.css";

export const SETTINGS_SECTIONS = [
  "personal",
  "account",
  "business",
  "notifications",
  "payments",
  "property_defaults",
  "region",
  "preferences",
  "privacy",
  "danger",
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

const SECTION_LABEL: Record<SettingsSection, string> = {
  personal: "Personal info",
  account: "Account & security",
  business: "Business entity",
  notifications: "Notifications",
  payments: "Payments & payout",
  property_defaults: "Property defaults",
  region: "Region & language",
  preferences: "App preferences",
  privacy: "Data & privacy",
  danger: "Danger zone",
};

const PLACEHOLDER_TEASERS: Record<Exclude<SettingsSection, "personal">, string> = {
  account: "Password, 2FA, active sessions, and email change.",
  business: "LLC / entity details, EIN, tax classification, and co-owners.",
  notifications: "Email and SMS preferences, digest cadence.",
  payments: "ACH details, W9, payout schedule, tax forms.",
  property_defaults:
    "Default cleaning fees, pricing rules, house rules across all properties.",
  region: "Time zone, locale, and currency preference.",
  preferences: "Dark mode, keyboard shortcuts, install as app.",
  privacy: "Export all data, connected services, third-party integrations.",
  danger:
    "Deactivate or delete owner. Destructive actions require re-confirmation.",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #02AAEB, #1B77BE)",
  "linear-gradient(135deg, #8A9AAB, #3C5266)",
  "linear-gradient(135deg, #F59E0B, #B45309)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export type SettingsTabProps = {
  data: OwnerDetailData;
  activeSection: SettingsSection;
  /** Extended profile fields needed by Personal info, served from the page. */
  profileExtras: {
    preferredName: string | null;
    contactMethod:
      | "email"
      | "sms"
      | "phone"
      | "whatsapp"
      | null;
  };
  internalNote: {
    text: string;
    updatedAt: string;
    createdByName: string | null;
  } | null;
};

export function SettingsTab({
  data,
  activeSection,
  profileExtras,
  internalNote,
}: SettingsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryMember, entity } = data;

  function switchSection(next: SettingsSection) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", "settings");
    if (next === "personal") {
      params.delete("section");
    } else {
      params.set("section", next);
    }
    router.replace(`/admin/owners/${entity.id}?${params.toString()}`, {
      scroll: false,
    });
  }

  // Demo signal: if the owner is missing a phone, nudge Payments & payout.
  const paymentsNeedsAttention = !primaryMember.phone;

  return (
    <div className={styles.root}>
      <nav className={styles.nav} aria-label="Settings sections">
        {renderNavItem("personal", activeSection, switchSection)}
        {renderNavItem("account", activeSection, switchSection)}
        {renderNavItem("business", activeSection, switchSection)}
        {renderNavItem("notifications", activeSection, switchSection)}
        {renderNavItem(
          "payments",
          activeSection,
          switchSection,
          paymentsNeedsAttention,
        )}
        {renderNavItem("property_defaults", activeSection, switchSection)}
        {renderNavItem("region", activeSection, switchSection)}
        {renderNavItem("preferences", activeSection, switchSection)}
        {renderNavItem("privacy", activeSection, switchSection)}
        <div className={styles.navDivider} aria-hidden />
        {renderNavItem("danger", activeSection, switchSection)}
      </nav>

      <div className={styles.content}>
        <ImpersonationBanner ownerName={primaryMember.fullName} />

        {activeSection === "personal" ? (
          <PersonalInfoSection
            profile={{
              id: primaryMember.id,
              fullName: primaryMember.fullName,
              preferredName: profileExtras.preferredName,
              email: primaryMember.email,
              phone: primaryMember.phone,
              contactMethod: profileExtras.contactMethod,
              avatarUrl: primaryMember.avatarUrl,
            }}
            internalNote={internalNote}
            gradient={gradientFor(primaryMember.id)}
          />
        ) : (
          <SectionPlaceholder
            title={SECTION_LABEL[activeSection]}
            subtitle={sectionSubtitle(activeSection)}
            teaser={PLACEHOLDER_TEASERS[activeSection]}
          />
        )}
      </div>
    </div>
  );
}

function sectionSubtitle(section: Exclude<SettingsSection, "personal">): string {
  switch (section) {
    case "account":
      return "Sign in and account protection.";
    case "business":
      return "Legal entity and tax setup.";
    case "notifications":
      return "When and how the owner hears from us.";
    case "payments":
      return "Where and when money moves.";
    case "property_defaults":
      return "Settings that apply across all properties.";
    case "region":
      return "Location, language, and currency.";
    case "preferences":
      return "Personal app behavior.";
    case "privacy":
      return "Who sees what, and what leaves.";
    case "danger":
      return "Destructive actions.";
  }
}

function renderNavItem(
  key: SettingsSection,
  active: SettingsSection,
  onSwitch: (next: SettingsSection) => void,
  withDot = false,
) {
  const isActive = active === key;
  const isDanger = key === "danger";
  const className = isDanger
    ? `${styles.navItem} ${styles.navItemDanger} ${
        isActive ? styles.navItemDangerActive : ""
      }`
    : `${styles.navItem} ${isActive ? styles.navItemActive : ""}`;
  return (
    <button
      key={key}
      type="button"
      className={className}
      onClick={() => onSwitch(key)}
    >
      <span>{SECTION_LABEL[key]}</span>
      {withDot ? (
        <span
          className={styles.navDot}
          aria-label="Needs attention"
          title="Needs attention"
        />
      ) : null}
    </button>
  );
}
