import { notFound } from "next/navigation";
import { getAllProperties, getProperty } from "@/content/properties";
import type { Metadata } from "next";
import PropertyDetail from "@/components/properties/PropertyDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProperties().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = getProperty(slug);

  if (!property) {
    return { title: "Property Not Found" };
  }

  return {
    title: `${property.title} | The Parcel Company`,
    description: property.tagline,
    openGraph: {
      title: `${property.title} | The Parcel Company`,
      description: property.tagline,
      images: property.photos[0] ? [{ url: property.photos[0] }] : [],
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = getProperty(slug);

  if (!property) {
    notFound();
  }

  return <PropertyDetail property={property} />;
}
