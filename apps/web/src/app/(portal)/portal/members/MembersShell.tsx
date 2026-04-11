"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UsersThree,
  BriefcaseMetal,
  MapPin,
  X,
  EnvelopeSimple,
  Phone,
} from "@phosphor-icons/react";

type ParcelTeamMember = {
  id: string;
  name: string;
  role: string;
  location: string | null;
  avatar_url: string | null;
};

type OwnerMember = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  responsibility: string | null;
};

type DrawerItem =
  | { type: "parcel"; data: ParcelTeamMember }
  | { type: "owner"; data: OwnerMember };

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function Avatar({
  src,
  name,
  email,
  size = 56,
  bgColor = "rgba(2, 170, 235, 0.12)",
  fgColor = "var(--color-brand)",
}: {
  src?: string | null;
  name?: string | null;
  email?: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}) {
  const initials = getInitials(name ?? null, email ?? "");
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fb = parent.querySelector("[data-fallback]") as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }
        }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: fgColor,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}

export function MembersShell({
  parcelTeam,
  ownerMembers,
  currentUserId,
}: {
  parcelTeam: ParcelTeamMember[];
  ownerMembers: OwnerMember[];
  currentUserId: string;
}) {
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);
  const closeDrawer = () => setDrawer(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Parcel Team */}
      <section className="flex flex-col gap-4">
        <h2
          className="text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Your Parcel Team
        </h2>

        {parcelTeam.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Your Parcel team members will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parcelTeam.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setDrawer({ type: "parcel", data: member })}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-colors hover:border-[var(--color-brand)]"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="shrink-0">
                  <Avatar
                    src={member.avatar_url}
                    name={member.name}
                    size={48}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {member.name}
                  </div>
                  <div
                    className="mt-1 flex items-center gap-1 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <BriefcaseMetal size={12} />
                    <span className="truncate">{member.role}</span>
                  </div>
                  {member.location && (
                    <div
                      className="mt-0.5 flex items-center gap-1 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <MapPin size={12} />
                      <span className="truncate">{member.location}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Owner Team */}
      <section className="flex flex-col gap-4">
        <h2
          className="text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Your Team
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ownerMembers.map((member) => {
            const isCurrent = member.id === currentUserId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setDrawer({ type: "owner", data: member })}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-colors hover:border-[var(--color-brand)]"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="shrink-0">
                  <Avatar
                    src={member.avatar_url}
                    name={member.full_name}
                    email={member.email}
                    size={48}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {member.full_name?.trim() || member.email}
                    </div>
                    {isCurrent && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: "rgba(2, 170, 235, 0.12)",
                          color: "var(--color-brand)",
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  {member.responsibility && (
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {member.responsibility}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Backdrop */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={closeDrawer}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="fixed inset-y-0 right-0 z-50 w-80 shadow-2xl"
              style={{ backgroundColor: "var(--color-white)" }}
            >
              {/* Close button */}
              <div className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: "var(--color-warm-gray-200)" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {drawer.type === "parcel" ? "Team Member" : "Owner"}
                </span>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
                  style={{ color: "var(--color-text-tertiary)" }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6">
                <div className="flex flex-col items-center text-center">
                  {drawer.type === "parcel" ? (
                    <Avatar
                      src={drawer.data.avatar_url}
                      name={drawer.data.name}
                      size={80}
                    />
                  ) : (
                    <Avatar
                      src={drawer.data.avatar_url}
                      name={drawer.data.full_name}
                      email={drawer.data.email}
                      size={80}
                    />
                  )}
                  <div
                    className="mt-4 text-lg font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {drawer.type === "parcel"
                      ? drawer.data.name
                      : drawer.data.full_name?.trim() || drawer.data.email}
                  </div>
                  <div
                    className="mt-0.5 text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {drawer.type === "parcel"
                      ? drawer.data.role
                      : drawer.data.responsibility ?? "Owner"}
                  </div>
                  {drawer.type === "parcel" && drawer.data.location && (
                    <div
                      className="mt-1.5 flex items-center gap-1 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      <MapPin size={13} />
                      {drawer.data.location}
                    </div>
                  )}
                </div>

                {drawer.type === "owner" && (
                  <>
                    <div
                      className="my-5 border-t"
                      style={{ borderColor: "var(--color-warm-gray-200)" }}
                    />
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center gap-3 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <EnvelopeSimple
                          size={16}
                          style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
                        />
                        <span className="min-w-0 truncate">{drawer.data.email}</span>
                      </div>
                      {drawer.data.phone && (
                        <div
                          className="flex items-center gap-3 text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <Phone
                            size={16}
                            style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
                          />
                          {drawer.data.phone}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
