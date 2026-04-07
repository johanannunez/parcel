"use client";

import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";
import { BLOG_POSTS } from "@/data/blog-posts";

const FEATURED_POSTS = BLOG_POSTS.slice(0, 3);

export default function JournalSection() {
  return (
    <section id="journal" aria-label="Journal" className="bg-warm-gray-50 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label text-brand">Journal</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                Stories from our properties
              </h2>
            </div>
            <a
              href="/blog"
              className="hidden items-center gap-2 text-sm font-semibold text-brand transition-opacity duration-300 hover:opacity-80 md:flex"
            >
              View all
              <ArrowRight size={16} weight="bold" />
            </a>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {FEATURED_POSTS.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.08}>
              <a href={`/blog/${post.slug}`} className="group block">
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
                  <h3 className="mt-2 text-base font-semibold leading-snug text-text-primary transition-colors duration-300 group-hover:text-brand md:text-lg">
                    {post.title}
                  </h3>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-10 text-center md:hidden">
          <a
            href="/blog"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand"
          >
            View all posts
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
