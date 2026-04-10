"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Upload a cropped avatar image and update the user's profile.
 * Expects a base64-encoded image (data URL) from the crop modal.
 */
export async function uploadAvatar(base64Data: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Extract the raw bytes from the data URL
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return { error: "Invalid image data" };

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const bytes = Buffer.from(match[2], "base64");
  const filePath = `avatars/${user.id}.${ext}`;

  // Upload to Supabase Storage (upsert to overwrite previous avatar)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, bytes, {
      contentType: `image/${match[1]}`,
      upsert: true,
    });

  if (uploadError) {
    // If bucket doesn't exist, provide a clear message
    if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
      return { error: "Avatar storage bucket not configured. Create a bucket named 'avatars' in Supabase Storage." };
    }
    return { error: uploadError.message };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Add a cache-busting timestamp so browsers pick up the new image
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath("/portal/account");
  revalidatePath("/portal");
  return { success: true, avatarUrl: publicUrl };
}

/**
 * Remove the user's avatar photo.
 */
export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Clear the avatar_url in profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Try to delete the storage file (don't fail if it doesn't exist)
  await supabase.storage.from("avatars").remove([`avatars/${user.id}.jpg`, `avatars/${user.id}.png`, `avatars/${user.id}.webp`]);

  revalidatePath("/portal/account");
  revalidatePath("/portal");
  return { success: true };
}
