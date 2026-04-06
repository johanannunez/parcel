import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Press | The Parcel Company" };

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
