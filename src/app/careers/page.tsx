import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Careers | The Parcel Company" };

export default function CareersPage() {
  return (
    <StaticPage title="Careers">
      <p>
        We&apos;re building the future of short-term rentals. If you care about
        quality, hospitality, and doing things the right way, we&apos;d love to
        hear from you.
      </p>
      <p>
        We don&apos;t have open positions listed right now, but we&apos;re
        always interested in meeting talented people. Send us a note at{" "}
        <a
          href="mailto:hello@theparcelco.com"
          className="text-brand hover:underline"
        >
          hello@theparcelco.com
        </a>{" "}
        and tell us what you&apos;re great at.
      </p>
    </StaticPage>
  );
}
