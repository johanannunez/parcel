"use client";

import { useActionState, useState, useId } from "react";
import { Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";
import { saveRecommendations, type SaveRecommendationsState } from "./actions";

type Spot = { name: string; why: string; address: string };

const initialState: SaveRecommendationsState = {};

export function RecommendationsForm({
  propertyId,
  savedSpots,
  isEditing,
}: {
  propertyId: string;
  savedSpots: Spot[];
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveRecommendations, initialState);
  const [spots, setSpots] = useState<Spot[]>(
    savedSpots.length > 0 ? savedSpots : [{ name: "", why: "", address: "" }],
  );

  function addSpot() {
    if (spots.length >= 5) return;
    setSpots((prev) => [...prev, { name: "", why: "", address: "" }]);
  }

  function removeSpot(idx: number) {
    setSpots((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSpot(idx: number, field: keyof Spot, value: string) {
    setSpots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="property_id" value={propertyId} />
      <input type="hidden" name="spots" value={JSON.stringify(spots)} />

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
          style={{ borderColor: "#f1c4c4", backgroundColor: "#fdf4f4", color: "#8a1f1f" }}
        >
          <WarningCircle size={18} weight="fill" style={{ color: "#c0372a" }} />
          <span>{state.error}</span>
        </div>
      ) : null}

      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Add 3 to 5 of your favorite nearby spots. Restaurants, coffee shops,
        parks, attractions. Anything a guest would appreciate knowing about.
      </p>

      {spots.map((spot, idx) => (
        <div
          key={idx}
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Spot {idx + 1}
            </span>
            {spots.length > 1 && (
              <button
                type="button"
                onClick={() => removeSpot(idx)}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: "#c0372a" }}
              >
                <Trash size={12} weight="bold" />
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <TextInput
              label="Place name"
              value={spot.name}
              onChange={(v) => updateSpot(idx, "name", v)}
              placeholder="e.g. Main Street Coffee"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
                Why you recommend it
              </label>
              <textarea
                value={spot.why}
                onChange={(e) => updateSpot(idx, "why", e.target.value)}
                rows={2}
                placeholder="Best breakfast burritos in town..."
                className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
              />
            </div>
            <TextInput
              label="Full address"
              value={spot.address}
              onChange={(v) => updateSpot(idx, "address", v)}
              placeholder="123 Main St, City, ST 12345"
            />
          </div>
        </div>
      ))}

      {spots.length < 5 && (
        <button
          type="button"
          onClick={addSpot}
          className="inline-flex items-center gap-2 self-start rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
        >
          <Plus size={14} weight="bold" />
          Add another spot
        </button>
      )}

      <StepSaveBar pending={pending} isEditing={isEditing} />
    </form>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}
