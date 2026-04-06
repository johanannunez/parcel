import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties — Vacation Rentals & Corporate Housing",
  description:
    "Browse verified vacation rentals and furnished corporate residences across the US. Filter by type, location, and amenities. Flexible cancellation included.",
  openGraph: {
    title: "Properties — Vacation Rentals & Corporate Housing | The Parcel Company",
    description:
      "Browse verified vacation rentals and furnished corporate residences across the US.",
  },
  alternates: {
    canonical: "https://theparcelco.com/properties",
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
