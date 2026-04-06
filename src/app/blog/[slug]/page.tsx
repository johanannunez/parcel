import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FrostedNav from "@/components/FrostedNav";
import DarkFooter from "@/components/DarkFooter";

const POSTS: Record<
  string,
  { title: string; date: string; readTime: string; image: string; body: string }
> = {
  "1": {
    title: "5 Things to Look for in a Furnished Corporate Stay",
    date: "Mar 10, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format",
    body: `When you're relocating for work or spending weeks away from home, the difference between a forgettable corporate rental and one that actually supports your life comes down to a handful of details.

## 1. A real workspace

A wobbly desk in the corner doesn't count. Look for a dedicated workspace with good lighting, an ergonomic chair, and reliable high-speed Wi-Fi. Your productivity depends on it.

## 2. A kitchen that works

Eating out every night gets old fast. Make sure the kitchen has real cookware, sharp knives, and enough counter space to prep a meal — not just a microwave and a coffee pod machine.

## 3. Laundry access

In-unit washer and dryer is ideal. At minimum, there should be facilities in the building. You shouldn't need to find a laundromat during a work trip.

## 4. Neighborhood walkability

Being close to a grocery store, a coffee shop, and a gym makes the difference between feeling settled and feeling stranded. Check the surroundings before you book.

## 5. Responsive management

Things break. Schedules change. You need a property manager who responds in hours, not days. Look for reviews that mention responsiveness.

---

At The Parcel Company, every property on our platform is vetted against these criteria and more. We believe corporate housing should feel like home — because it is, even if only for a month.`,
  },
  "2": {
    title: "The Best Mountain Getaways for Families This Spring",
    date: "Mar 5, 2026",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1470770841497-7b3200f18201?w=1200&q=80&auto=format",
    body: `Spring in the mountains is a well-kept secret. The snow is melting, the wildflowers are starting, and the crowds haven't arrived yet. Here are our top picks for families this season.

## Breckenridge, Colorado

Our Mountain Retreat with Hot Tub sleeps six comfortably and sits ten minutes from town. Spring means discounted lift tickets, fewer lines, and warm afternoons on the deck.

## Park City, Utah

World-class trails for hiking and mountain biking open in late April. Our Park City properties offer ski-in convenience that converts to trailhead access in spring.

## Big Sky, Montana

If you want space — real space — Big Sky delivers. Fewer tourists, bigger skies, and properties with views that remind you why you planned this trip in the first place.

---

Spring availability fills fast. Browse our [vacation rentals](/properties?type=vacation) to find the right fit for your family.`,
  },
  "3": {
    title: "How to Make a Vacation Rental Feel Like Home",
    date: "Feb 28, 2026",
    readTime: "3 min read",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format",
    body: `A vacation rental gives you more room than a hotel, but it can still feel impersonal when you first walk in. A few small touches change that entirely.

## Bring your morning routine

Pack your favorite coffee or tea. The ritual of making it in a new kitchen instantly makes the space feel more familiar.

## Unpack fully

Don't live out of a suitcase. Use the drawers, hang your clothes, spread out. The ten minutes it takes to unpack pays back in comfort for the rest of the trip.

## Stock the fridge on arrival

Hit a grocery store before you settle in. Having snacks, drinks, and breakfast ingredients means you wake up the next morning already at home.

## Set the mood

A small Bluetooth speaker and a playlist you love can transform any space. Lighting matters too — turn off the overheads and use the lamps.

---

The best vacation rentals anticipate these needs. At The Parcel Company, our properties come stocked with quality basics so you can focus on enjoying the trip, not setting it up.`,
  },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  return (
    <>
      <FrostedNav />
      <main className="min-h-screen bg-surface pt-[120px] pb-24">
        <article className="mx-auto max-w-[720px] px-6">
          <Link
            href="/blog"
            className="text-sm font-medium text-brand hover:underline"
          >
            &larr; Back to Journal
          </Link>

          <h1 className="mt-6 text-3xl font-bold leading-tight text-text-primary md:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-sm text-text-tertiary">
            <time>{post.date}</time>
            <span className="h-1 w-1 rounded-full bg-warm-gray-400" />
            <span>{post.readTime}</span>
          </div>

          <div className="relative mt-8 aspect-[2/1] overflow-hidden rounded-[var(--radius-md)]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
              priority
            />
          </div>

          <div className="prose prose-lg mt-10 max-w-none text-text-secondary">
            {post.body.split("\n\n").map((block, i) => {
              if (block.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="mt-8 mb-3 text-xl font-bold text-text-primary"
                  >
                    {block.replace("## ", "")}
                  </h2>
                );
              }
              if (block === "---") {
                return (
                  <hr key={i} className="my-8 border-warm-gray-200" />
                );
              }
              return (
                <p key={i} className="mb-4 leading-relaxed">
                  {block}
                </p>
              );
            })}
          </div>
        </article>
      </main>
      <DarkFooter />
    </>
  );
}
