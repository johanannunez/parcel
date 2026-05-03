"use server";
import { revalidatePath } from "next/cache";
import { generateWorkspaceIntelligence } from "@/lib/admin/workspace-intelligence";

export async function regenerateWorkspaceIntelligence(contactId: string): Promise<void> {
  await generateWorkspaceIntelligence(contactId);
  revalidatePath(`/admin/workspaces/${contactId}`);
}
