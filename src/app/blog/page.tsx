import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FrostedNav from "@/components/FrostedNav";
import DarkFooter from "@/components/DarkFooter";

export const metadata: Metadata = {
  title: "Journal — Tips, Guides & Vacation Rental Insights",
  description:
    "Read expert tips on vacation rentals, corporate housing, travel destinations, and property management. Stories and insights from The Parcel Company.",
  openGraph: {
    title: "Journal | The Parcel Company",
    description:
      "Expert tips on vacation rentals, corporate housing, and travel destinations.",
  },
  alternates: {
    canonical: "https://theparcelco.com/blog",
  },
};

const POSTS = [
  {
    slug: "1",
    title: "5 Things to Look for in a Furnished Corporate Stay",
    date: "Mar 10, 2026",
    readTime: "4 min read",
    excerpt:
      "Finding the right corporate housing goes beyond just a bed and a desk. Here are the five details that separate a good stay from a great one.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&auto=format",
  },
  {
    slug: "2",
    title: "The Best Mountain Getaways for Families This Spring",
    date: "Mar 5, 2026",
    readTime: "6 min read",
    excerpt:
      "Spring in the mountains means wildflowers, lighter crowds, and perfect temperatures. We picked the best family-friendly properties across Colorado, Utah, and Montana.",
    image:
      "https://images.unsplash.com/photo-1470770841497-7b3200f18201?w=800&q=80&auto=format",
  },
  {
    slug: "3",
    title: "How to Make a Vacation Rental Feel Like Home",
    date: "Feb 28, 2026",
    readTime: "3 min read",
    excerpt:
      "A few small touches can turn any rental into a place that feels genuinely yours. From pantry staples to playlist curation, here is our guide.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format",
  },
];

export default function BlogPage() {
  return (
    <>
      <FrostedNav />
      <main className="min-h-screen bg-warm-gray-50 pt-[120px] pb-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
          <h1 className="text-h1 text-text-primary">Journal</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
            Stories, tips, and inspiration from our properties.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-md)]">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <time>{post.date}</time>
                    <span className="h-1 w-1 rounded-full bg-warm-gray-400" />
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold leading-snug text-text-primary transition-colors duration-300 group-hover:text-brand">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <DarkFooter />
    </>
  );
}
