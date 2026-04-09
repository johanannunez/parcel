import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminMessagesShell } from "./AdminMessagesShell";

export const metadata: Metadata = {
  title: "Messages (Admin)",
};
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const svc = createServiceClient();

  // Fetch all conversations
  const { data: conversations } = await svc
    .from("conversations")
    .select("id, owner_id, subject, type, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(200);

  // Fetch owner profiles
  const ownerIds = [
    ...new Set((conversations ?? []).map((c) => c.owner_id).filter(Boolean)),
  ] as string[];

  const { data: owners } = ownerIds.length
    ? await svc.from("profiles").select("id, full_name, email").in("id", ownerIds)
    : { data: [] };

  const ownerMap = new Map(
    (owners ?? []).map((o) => [
      o.id,
      { name: o.full_name?.trim() || o.email, email: o.email },
    ]),
  );

  // Fetch last message per conversation
  const convIds = (conversations ?? []).map((c) => c.id);
  const { data: allMessages } = convIds.length
    ? await svc
        .from("messages")
        .select(
          "id, conversation_id, sender_id, body, delivery_method, created_at",
        )
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMessageMap = new Map<
    string,
    {
      body: string;
      senderId: string;
      createdAt: string;
      deliveryMethod: string;
    }
  >();
  for (const m of allMessages ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, {
        body: m.body,
        senderId: m.sender_id,
        createdAt: m.created_at,
        deliveryMethod: m.delivery_method,
      });
    }
  }

  // Fetch all owners for the compose owner picker
  const { data: allOwners } = await svc
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "owner")
    .order("full_name");

  const enriched = (conversations ?? []).map((c) => ({
    id: c.id,
    ownerId: c.owner_id,
    subject: c.subject,
    type: c.type as "direct" | "announcement" | "email_log",
    lastMessageAt: c.last_message_at,
    ownerName: c.owner_id
      ? (ownerMap.get(c.owner_id)?.name ?? "Unknown")
      : null,
    ownerEmail: c.owner_id
      ? (ownerMap.get(c.owner_id)?.email ?? "")
      : null,
    lastMessage: lastMessageMap.get(c.id) ?? null,
  }));

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <AdminMessagesShell
        conversations={enriched}
        allOwners={(allOwners ?? []).map((o) => ({
          id: o.id,
          name: o.full_name?.trim() || o.email,
          email: o.email,
        }))}
        selectedOwnerId={params.owner ?? null}
        initialFilter={params.filter ?? "all"}
      />
    </div>
  );
}
