"use client";

import { useId } from "react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

export function WifiForm() {
  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-8">
      <input type="hidden" name="just" value="wifi" />

      <Section title="Network details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput name="isp" label="Internet provider" placeholder="e.g. Xfinity, AT&T" />
          <TextInput name="ssid" label="Network name (SSID)" placeholder="MyHomeNetwork" required />
          <TextInput name="wifi_password" label="Wi-Fi password" placeholder="The one guests connect with" required />
          <TextInput name="router_location" label="Router location" placeholder="e.g. Living room closet, top shelf" />
        </div>
      </Section>

      <Section title="Equipment location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput name="modem_location" label="Modem location" placeholder="e.g. Garage, near the panel" />
        </div>
        <p className="mt-3 text-[13px]" style={{ color: "var(--color-text-tertiary)" }}>
          Upload photos of the router and modem coming soon.
        </p>
      </Section>

      <Section title="Account admin (for billing and troubleshooting)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextInput name="isp_website" label="ISP website URL" placeholder="https://xfinity.com" />
          <TextInput name="isp_username" label="Account username" placeholder="your-email@example.com" />
          <TextInput name="isp_password" label="Account password" placeholder="Your ISP login password" type="password" />
        </div>
        <p className="mt-3 text-[13px]" style={{ color: "var(--color-text-tertiary)" }}>
          This is encrypted and only used if we need to troubleshoot an outage for your guests.
        </p>
      </Section>

      <StepSaveBar pending={false} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}>
      <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {children}
    </section>
  );
}

function TextInput({ name, label, placeholder, required, type = "text" }: { name: string; label: string; placeholder?: string; required?: boolean; type?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}{required ? <span className="ml-1" style={{ color: "var(--color-brand)" }}>*</span> : null}
      </label>
      <input id={id} name={name} type={type} placeholder={placeholder} required={required}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}
