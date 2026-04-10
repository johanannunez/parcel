"use client"

import { useActionState, useState, useRef } from "react"
import { CalendarBlank, Camera, Trash } from "@phosphor-icons/react"
import { updateProfile } from "../actions"
import { uploadAvatar, removeAvatar } from "../avatar-actions"
import { AvatarCropModal } from "@/components/portal/AvatarCropModal"

type Props = {
  profile: {
    full_name: string | null
    preferred_name: string | null
    email: string
    phone: string | null
    contact_method: string | null
    avatar_url: string | null
    created_at: string
  }
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
  }
  return email[0]?.toUpperCase() ?? "?"
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

export default function ProfileSection({ profile }: Props) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)
  const [phone, setPhone] = useState(profile.phone ? formatPhone(profile.phone) : "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = getInitials(profile.full_name, profile.email)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleCrop = async (croppedDataUrl: string) => {
    setCropSrc(null)
    setUploading(true)
    const result = await uploadAvatar(croppedDataUrl)
    setUploading(false)
    if (result.success && result.avatarUrl) {
      setAvatarUrl(result.avatarUrl)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    const result = await removeAvatar()
    setUploading(false)
    if (result.success) {
      setAvatarUrl(null)
    }
  }

  return (
    <section id="profile">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Profile
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Your personal details and contact preferences.
      </p>

      <div
        className="rounded-2xl border p-7"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <form action={formAction}>
          {/* Avatar + Member Since */}
          <div className="mb-6 flex items-center gap-4">
            <div className="group relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.full_name ?? "Avatar"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{ backgroundColor: "var(--color-brand)" }}
                >
                  {initials}
                </div>
              )}

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera size={20} weight="bold" className="text-white" />
              </button>

              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {profile.full_name ?? profile.email}
              </span>
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                <CalendarBlank size={12} weight="bold" />
                Member since {formatMemberSince(profile.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: "var(--color-brand)" }}
                >
                  {avatarUrl ? "Change photo" : "Upload photo"}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    <Trash size={11} />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Crop Modal */}
          {cropSrc ? (
            <AvatarCropModal
              imageSrc={cropSrc}
              onCrop={handleCrop}
              onCancel={() => setCropSrc(null)}
            />
          ) : null}

          {/* Full Name */}
          <div className="mb-5">
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={profile.full_name ?? ""}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
            />
          </div>

          {/* Preferred Name */}
          <div className="mb-5">
            <label
              htmlFor="preferred_name"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Preferred name
            </label>
            <input
              id="preferred_name"
              name="preferred_name"
              type="text"
              defaultValue={profile.preferred_name ?? ""}
              placeholder="What should we call you?"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
            />
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
            />
          </div>

          {/* Contact Method */}
          <div className="mb-6">
            <label
              htmlFor="contact_method"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Preferred contact method
            </label>
            <select
              id="contact_method"
              name="contact_method"
              defaultValue={profile.contact_method ?? "email"}
              className="w-full appearance-none rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text</option>
            </select>
          </div>

          {/* Status Message */}
          {state && !state.ok && (
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-error)" }}
            >
              {state.message}
            </p>
          )}
          {state?.ok && (
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-success)" }}
            >
              {state.message}
            </p>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </section>
  )
}
