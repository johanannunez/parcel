import type { Metadata } from "next";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Owners",
};

export default function OwnersIndexPage() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      >
        <UsersThree size={24} weight="duotone" style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
      <h2 className="text-lg font-semibold text-white">
        Select an owner
      </h2>
      <p
        className="mt-1.5 max-w-xs text-sm"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        Pick someone from the list to view their dashboard, properties, calendar, and more.
      </p>
    </div>
  );
}
