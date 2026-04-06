import StaticPage from "@/components/StaticPage";

export const metadata = { title: "About | The Parcel Company" };

export default function AboutPage() {
  return (
    <StaticPage title="About Us">
      <p>
        The Parcel Company curates vacation homes and furnished residences for
        people who notice the details. We partner with property owners who share
        our standards — quality furnishings, responsive management, and spaces
        that feel like home from the moment you walk in.
      </p>
      <p>
        Whether you&apos;re booking a weekend escape or a month-long corporate
        stay, every listing on our platform has been personally vetted. No
        surprises, no compromises.
      </p>
      <p>
        Founded with a simple belief: short-term rentals can be better. We&apos;re
        proving it one property at a time.
      </p>
    </StaticPage>
  );
}
