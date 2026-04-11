"use server";

import { getPortalContext } from "@/lib/portal-context";
import { revalidatePath } from "next/cache";

export type ImageSource = "aerial" | "street" | "photo";

/**
 * Updates the image_source field on a property.
 * Uses getPortalContext() so it works correctly both when an owner
 * is viewing their own portal and when an admin is impersonating an owner.
 */
export async function updatePropertyImageSource(
  propertyId: string,
  source: ImageSource,
): Promise<{ ok: boolean; error?: string }> {
  const { userId, client } = await getPortalContext();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client as any)
    .from("properties")
    .update({ image_source: source })
    .eq("id", propertyId)
    .eq("owner_id", userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/properties");
  return { ok: true };
}

/**
 * Saves an uploaded cover photo URL and sets image_source to "photo".
 */
export async function updatePropertyCoverPhoto(
  propertyId: string,
  coverPhotoUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const { userId, client } = await getPortalContext();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client as any)
    .from("properties")
    .update({ cover_photo_url: coverPhotoUrl, image_source: "photo" })
    .eq("id", propertyId)
    .eq("owner_id", userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/properties");
  return { ok: true };
}
