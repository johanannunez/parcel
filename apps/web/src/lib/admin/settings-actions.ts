"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const EntitySchema = z.object({
  entityId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(["LLC", "S-Corp", "C-Corp", "Sole Proprietor", "Partnership", ""]),
  ein: z.string().trim().max(20),
  notes: z.string().trim().max(4000),
});

export async function updateEntity(input: z.infer<typeof EntitySchema>): Promise<ActionResult> {
  const parsed = EntitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid entity data." };
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("entities")
    .update({
      name: parsed.data.name,
      type: parsed.data.type ? parsed.data.type : null,
      ein: parsed.data.ein ? parsed.data.ein : null,
      notes: parsed.data.notes ? parsed.data.notes : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.entityId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/owners/${parsed.data.entityId}`);
  return { ok: true };
}

const RegionSchema = z.object({
  profileId: z.string().uuid(),
  timezone: z.string().trim().max(64),
});

export async function updateProfileRegion(
  input: z.infer<typeof RegionSchema>,
): Promise<ActionResult> {
  const parsed = RegionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid region data." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ timezone: parsed.data.timezone, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/owners");
  return { ok: true };
}
