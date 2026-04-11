import { createServiceClient } from "@/lib/supabase/service";

/**
 * Create an in-app notification for an owner.
 * Fire-and-forget: does not throw on failure.
 *
 * Use this from server actions when something happens that the
 * owner should know about (block request approved, payout processed,
 * new message received, etc.).
 */
export async function createNotification(args: {
  ownerId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const svc = createServiceClient();

  const { error } = await svc.from("notifications").insert({
    owner_id: args.ownerId,
    type: args.type,
    title: args.title,
    body: args.body,
    link: args.link ?? null,
  });

  if (error) {
    console.error("[Notifications] Failed to create notification:", error);
  }
}

/**
 * Create a notification for all owners (e.g., system-wide announcement).
 */
export async function createNotificationForAllOwners(args: {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const svc = createServiceClient();

  const { data: owners } = await svc
    .from("profiles")
    .select("id")
    .eq("role", "owner");

  if (!owners?.length) return;

  const rows = owners.map((owner) => ({
    owner_id: owner.id,
    type: args.type,
    title: args.title,
    body: args.body,
    link: args.link ?? null,
  }));

  const { error } = await svc.from("notifications").insert(rows);

  if (error) {
    console.error("[Notifications] Failed to create bulk notifications:", error);
  }
}

export type NotificationType =
  | "message_received"
  | "announcement"
  | "block_approved"
  | "block_denied"
  | "payout_processed"
  | "new_booking"
  | "setup_reminder";
