import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";

const poppins = localFont({
  src: [
    { path: "../../public/fonts/Poppins-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Poppins-Bold.ttf", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const raleway = localFont({
  src: [
    { path: "../../public/fonts/Raleway-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Raleway-Medium.ttf", weight: "500" },
  ],
  variable: "--font-raleway",
  display: "swap",
});

const nexa = localFont({
  src: [{ path: "../../public/fonts/Nexa-Bold.otf", weight: "700" }],
  variable: "--font-nexa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Parcel Company | Premium Vacation Rentals in Washington",
  description:
    "Book curated vacation homes across Washington state. Premium stays in Pasco, Kennewick, Spokane, Richland, and Vancouver. Direct booking saves you 10%.",
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
    title: "The Parcel Company | Premium Vacation Rentals in Washington",
    description:
      "Curated vacation homes across Washington. Book direct and save 10%.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${poppins.variable} ${raleway.variable} ${nexa.variable}`}
      >
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
