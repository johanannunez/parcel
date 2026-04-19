'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const IconIdSchema = z.string().max(60).nullable().optional();
const IconColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional();

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  iconId: IconIdSchema,
  iconColor: IconColorSchema,
  searchParams: z.object({
    view: z.string().optional(),
    mode: z.string().optional(),
    source: z.string().optional(),
    assignee: z.string().optional(),
    q: z.string().optional(),
  }),
});

const RenameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  iconId: IconIdSchema,
  iconColor: IconColorSchema,
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

const MoveSchema = z.object({
  contactId: z.string().uuid(),
  stage: z.enum([
    'lead_new', 'qualified', 'in_discussion', 'contract_sent',
    'onboarding', 'active_owner', 'lead_cold', 'paused', 'churned',
  ]),
});

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return { ok: false as const, error: 'Admins only.' };
  }
  return { ok: true as const, supabase, user };
}

function prunedSearchParams(sp: Record<string, string | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string' && v.length > 0) out[k] = v;
  }
  return out;
}

export async function createSavedView(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const auth = await getAdminUser();
  if (!auth.ok) return auth;

  const { supabase, user } = auth;
  const key = crypto.randomUUID();
  const search = prunedSearchParams(parsed.data.searchParams);

  const { data, error } = await supabase
    .from('saved_views')
    .insert({
      entity_type: 'contact',
      key,
      name: parsed.data.name,
      icon_id: parsed.data.iconId ?? null,
      icon_color: parsed.data.iconColor ?? null,
      owner_user_id: user.id,
      is_shared: false,
      sort_order: 1000,
      filter_jsonb: { search_params: search },
      view_mode: 'compact',
      sort: 'name_asc',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts');
  return { ok: true, data: { id: data.id } };
}

export async function renameSavedView(
  input: unknown,
): Promise<ActionResult> {
  const parsed = RenameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase, user } = auth;

  const { data: existing, error: lookupError } = await supabase
    .from('saved_views')
    .select('is_shared, owner_user_id')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (lookupError) return { ok: false, error: lookupError.message };
  if (!existing) return { ok: false, error: 'View not found.' };

  if (!existing.is_shared && existing.owner_user_id !== user.id) {
    return { ok: false, error: 'Not your view.' };
  }

  const { error } = await supabase
    .from('saved_views')
    .update({
      name: parsed.data.name,
      icon_id: parsed.data.iconId ?? null,
      icon_color: parsed.data.iconColor ?? null,
    })
    .eq('id', parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts');
  return { ok: true, data: null };
}

export async function deleteSavedView(
  input: unknown,
): Promise<ActionResult> {
  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase, user } = auth;

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', parsed.data.id)
    .eq('owner_user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts');
  return { ok: true, data: null };
}

export async function updateContactStage(
  input: unknown,
): Promise<ActionResult> {
  const parsed = MoveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const { error } = await supabase
    .from('contacts')
    .update({
      lifecycle_stage: parsed.data.stage,
      stage_changed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.contactId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts');
  return { ok: true, data: null };
}

// ── Contact sources ────────────────────────────────────────────────────────

export async function createContactSource(label: string): Promise<ActionResult> {
  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: 'Label is required.' };

  const slug = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (!slug) return { ok: false, error: 'Label must contain letters or numbers.' };

  const { data: last } = await supabase
    .from('contact_sources')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from('contact_sources')
    .insert({ label: trimmed, slug, sort_order: nextOrder });

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'A source with this slug already exists.' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/contacts', 'layout');
  return { ok: true, data: null };
}

export async function updateContactSource(
  id: string,
  fields: { label?: string; active?: boolean },
): Promise<ActionResult> {
  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const { error } = await supabase
    .from('contact_sources')
    .update({
      ...(fields.label !== undefined ? { label: fields.label.trim() } : {}),
      ...(fields.active !== undefined ? { active: fields.active } : {}),
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts', 'layout');
  return { ok: true, data: null };
}

export async function deleteContactSource(id: string): Promise<ActionResult> {
  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const { data: source } = await supabase
    .from('contact_sources')
    .select('slug, label')
    .eq('id', id)
    .single();

  if (!source) return { ok: false, error: 'Source not found.' };

  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('source', source.slug);

  if (count && count > 0) {
    return {
      ok: false,
      error: `${count} contact${count === 1 ? '' : 's'} use "${source.label}" — deactivate it instead.`,
    };
  }

  const { error } = await supabase
    .from('contact_sources')
    .delete()
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/contacts', 'layout');
  return { ok: true, data: null };
}
