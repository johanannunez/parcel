import StaticPage from "@/components/StaticPage";

export const metadata = {
  title: "Help Center",
  description: "Find answers about booking, check-in, cancellations, and property management at The Parcel Company.",
  alternates: { canonical: "https://theparcelco.com/help" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I book a property?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Browse our properties page, select the one you like, and follow the booking flow. You'll receive a confirmation email once your reservation is confirmed.",
      },
    },
    {
      "@type": "Question",
      name: "What is the cancellation policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cancellation policies vary by property. Check the specific listing for details, or see our cancellation policy page.",
      },
    },
    {
      "@type": "Question",
      name: "How do I contact support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Email us at hello@theparcelco.com. We respond within 24 hours on business days.",
      },
    },
  ],
};

export default function HelpPage() {
  return (
    <StaticPage title="Help Center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
