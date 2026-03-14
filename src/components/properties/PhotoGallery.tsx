"use client";

import Image from "next/image";
import { motion } from "motion/react";

interface PhotoGalleryProps {
  photos: string[];
  title: string;
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const heroPhoto = photos[0];
  const gridPhotos = photos.slice(1, 5);

  return (
    <div className="px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width)] mx-auto pt-4">
        {/* Hero + grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
          {/* Hero image */}
          <motion.div
            className="relative aspect-[3/2] lg:aspect-auto lg:row-span-2 rounded-[var(--radius-lg)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroPhoto ? (
              <Image
                src={heroPhoto}
                alt={`${title} hero`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center min-h-[300px] lg:min-h-full">
                <span className="text-[var(--text-tertiary)] text-sm">No photo available</span>
              </div>
            )}
          </motion.div>

          {/* Grid of 4 photos (2x2) */}
          {gridPhotos.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 lg:gap-3">
              {gridPhotos.map((photo, i) => (
                <motion.div
                  key={photo}
                  className="relative rounded-[var(--radius-md)] overflow-hidden"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Image
                    src={photo}
                    alt={`${title} photo ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Mobile secondary photos (horizontal scroll) */}
          {gridPhotos.length > 0 && (
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {gridPhotos.map((photo, i) => (
                <div
                  key={photo}
                  className="relative shrink-0 w-[70%] aspect-[4/3] rounded-[var(--radius-md)] overflow-hidden snap-start"
                >
                  <Image
                    src={photo}
                    alt={`${title} photo ${i + 2}`}
                    fill
                    sizes="70vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
