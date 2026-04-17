import type { Metadata } from "next";
import { fetchAdminOwnersList } from "@/lib/admin/owners-list";
import { OwnersListView } from "./OwnersListView";

export const metadata: Metadata = { title: "Owners" };
export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const rows = await fetchAdminOwnersList();
  return <OwnersListView initialRows={rows} />;
}
