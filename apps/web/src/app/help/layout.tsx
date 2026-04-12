import type { Metadata } from "next";
import FrostedNav from "@/components/FrostedNav";
import DarkFooter from "@/components/DarkFooter";

export const metadata: Metadata = {
  title: {
    default: "Help Center",
    template: "%s | Help Center | The Parcel Company",
  },
  description:
    "Find answers about property management, payouts, calendar, bookings, and your owner portal at The Parcel Company.",
  alternates: { canonical: "https://theparcelco.com/help" },
  openGraph: {
    title: "Help Center | The Parcel Company",
    description:
      "Find answers about property management, payouts, calendar, bookings, and your owner portal.",
    type: "website",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FrostedNav />
      {children}
      <DarkFooter />
    </>
  );
}
