import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Help Center | The Parcel Company" };

export default function HelpPage() {
  return (
    <StaticPage title="Help Center">
      <p>
        Need help with a booking, a property question, or your account? We&apos;re
        here for you.
      </p>
      <h2 className="mt-6 text-xl font-bold text-text-primary">
        Common Questions
      </h2>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        How do I book a property?
      </h3>
      <p>
        Browse our <a href="/properties" className="text-brand hover:underline">properties page</a>,
        select the one you like, and follow the booking flow. You&apos;ll receive a
        confirmation email once your reservation is confirmed.
      </p>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        What is the cancellation policy?
      </h3>
      <p>
        Cancellation policies vary by property. Check the specific listing for
        details, or see our <a href="/cancellation" className="text-brand hover:underline">cancellation policy</a> page.
      </p>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        How do I contact support?
      </h3>
      <p>
        Email us at{" "}
        <a
          href="mailto:hello@theparcelco.com"
          className="text-brand hover:underline"
        >
          hello@theparcelco.com
        </a>
        . We respond within 24 hours on business days.
      </p>
    </StaticPage>
  );
}
