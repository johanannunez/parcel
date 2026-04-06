import StaticPage from "@/components/StaticPage";

export const metadata = {
  title: "Press",
  description: "Press resources and media inquiries for The Parcel Company, a premium vacation rental and corporate housing platform.",
  alternates: { canonical: "https://theparcelco.com/press" },
};

export default function PressPage() {
  return (
    <StaticPage title="Press">
      <p>
        For press inquiries, partnership requests, or media assets, contact us
        at{" "}
        <a
          href="mailto:hello@theparcelco.com"
          className="text-brand hover:underline"
        >
          hello@theparcelco.com
        </a>
        .
      </p>
    </StaticPage>
  );
}
