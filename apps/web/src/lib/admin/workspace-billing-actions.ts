"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  createWorkspaceSetupIntent,
  ensureStripeCustomerForWorkspace,
} from "@/lib/billing/stripe-workspace";

const WorkspaceInput = z.object({
  workspaceId: z.string().uuid(),
});

type BillingProfileResult =
  | { ok: true; billingProfileId: string; stripeCustomerId: string }
  | { ok: false; error: string };

type SetupIntentResult =
  | {
      ok: true;
      billingProfileId: string;
      stripeCustomerId: string;
      clientSecret: string;
    }
  | { ok: false; error: string };

export async function ensureWorkspaceBillingProfileAction(
  raw: unknown,
): Promise<BillingProfileResult> {
  const parsed = WorkspaceInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid workspace." };
  }

  try {
    const { user } = await requireAdminUser();
    const result = await ensureStripeCustomerForWorkspace({
      workspaceId: parsed.data.workspaceId,
      createdBy: user.id,
    });
    revalidatePath(`/admin/workspaces/${parsed.data.workspaceId}`);
    revalidatePath("/admin/billing");
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create billing profile.",
    };
  }
}

export async function createWorkspacePaymentSetupIntentAction(
  raw: unknown,
): Promise<SetupIntentResult> {
  const parsed = WorkspaceInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid workspace." };
  }

  try {
    const { user } = await requireAdminUser();
    const result = await createWorkspaceSetupIntent({
      workspaceId: parsed.data.workspaceId,
      createdBy: user.id,
    });
    revalidatePath(`/admin/workspaces/${parsed.data.workspaceId}`);
    revalidatePath("/admin/billing");
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not start payment setup.",
    };
  }
}
