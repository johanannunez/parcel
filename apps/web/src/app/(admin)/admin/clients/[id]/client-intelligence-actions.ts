"use server";
import { revalidatePath } from "next/cache";
import { generateClientIntelligence } from "@/lib/admin/client-intelligence";

export async function regenerateClientIntelligence(contactId: string): Promise<void> {
  await generateClientIntelligence(contactId);
  revalidatePath(`/admin/clients/${contactId}`);
}
