import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const generalSans = localFont({
  src: [
    {
      path: "../fonts/GeneralSans-Variable.ttf",
      style: "normal",
    },
    {
      path: "../fonts/GeneralSans-VariableItalic.ttf",
      style: "italic",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://theparcelco.com"),
  title: {
    default: "The Parcel Company | Vacation Rentals & Furnished Residences",
    template: "%s | The Parcel Company",
  },
  description:
    "Book handpicked vacation homes and furnished corporate residences across the US. Verified properties, flexible cancellation, and responsive management.",
  keywords: [
    "vacation rentals",
    "furnished residences",
    "corporate housing",
    "short-term rentals",
    "vacation homes",
    "furnished apartments",
    "corporate stays",
    "property management",
  ],
  authors: [{ name: "The Parcel Company" }],
  creator: "The Parcel Company",
  publisher: "The Parcel Company",
  openGraph: {
    title: "The Parcel Company | Vacation Rentals & Furnished Residences",
    description:
      "Book handpicked vacation homes and furnished corporate residences across the US. Verified properties, flexible cancellation, and responsive management.",
    type: "website",
    locale: "en_US",
    siteName: "The Parcel Company",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Parcel Company | Vacation Rentals & Furnished Residences",
    description:
      "Book handpicked vacation homes and furnished corporate residences across the US.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://theparcelco.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Parcel Company",
    url: "https://theparcelco.com",
    logo: "https://theparcelco.com/brand/logo-mark.png",
    description:
      "Vacation homes and furnished residences, handpicked for people who notice the details.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@theparcelco.com",
      contactType: "customer service",
    },
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Parcel Company",
    url: "https://theparcelco.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://theparcelco.com/properties?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Vacation Rental & Corporate Housing",
    provider: {
      "@type": "Organization",
      name: "The Parcel Company",
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    description:
      "Handpicked vacation homes and furnished corporate residences across the US. Verified properties, flexible cancellation, and responsive management.",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${generalSans.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema, serviceSchema]),
          }}
        />
        <ThemeProvider>
        {children}
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
