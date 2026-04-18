import type { Metadata } from "next";
import FrostedNav from "@/components/FrostedNav";
import DarkFooter from "@/components/DarkFooter";

export const metadata: Metadata = {
  title: {
    default: "Parcel Co. | Help Center",
    template: "Parcel Co. | %s | Help Center",
  },
  description:
    "Find answers about property management, payouts, calendar, bookings, and your owner portal at Parcel Co.",
  alternates: { canonical: "https://theparcelco.com/help" },
  openGraph: {
    title: "Parcel Co. | Help Center",
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
