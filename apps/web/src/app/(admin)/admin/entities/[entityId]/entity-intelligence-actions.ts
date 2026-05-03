"use server";
import { revalidatePath } from "next/cache";
import { generateEntityIntelligence } from "@/lib/admin/entity-intelligence";

export async function regenerateEntityIntelligence(contactId: string): Promise<void> {
  await generateEntityIntelligence(contactId);
  revalidatePath(`/admin/entities/${contactId}`);
}
