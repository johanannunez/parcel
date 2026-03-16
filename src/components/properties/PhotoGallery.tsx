"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Camera } from "@phosphor-icons/react";

interface PhotoGalleryProps {
  photos: string[];
  title: string;
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const heroPhoto = photos[0];
  const gridPhotos = photos.slice(1, 5);

  return (
    <div>
      {/* Hero image: full-bleed, cinematic */}
      <motion.div
        className="relative max-h-[70vh] aspect-[16/9] overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      >
        {heroPhoto ? (
          <Image
            src={heroPhoto}
            alt={`${title} hero`}
            fill
            sizes="100vw"
            className="object-cover"
            style={{
              animation: "kenBurns 20s ease-in-out forwards",
            }}
            priority
          />
        ) : (
          <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center min-h-[300px]">
            <span className="text-[var(--text-tertiary)] text-sm font-[family-name:var(--font-raleway)]">
              No photo available
            </span>
          </div>
        )}

        {/* View all photos button: bottom-left overlay */}
        {photos.length > 1 && (
          <motion.button
            className="
              absolute bottom-4 left-4 z-10
              inline-flex items-center gap-2
              bg-white/80 backdrop-blur-xl text-[var(--text-primary)]
              px-4 py-2 rounded-full text-sm font-semibold
              shadow-[var(--shadow-md)]
              font-[family-name:var(--font-poppins)]
              cursor-pointer
              hover:bg-white hover:shadow-[var(--shadow-lg)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-bright)] focus-visible:ring-offset-2
              transition-[background,box-shadow] duration-200 ease-out
            "
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <Camera size={16} weight="bold" />
            View all photos
          </motion.button>
        )}

        {/* Thumbnail grid: floating bottom-right overlay (desktop only) */}
        {gridPhotos.length > 0 && (
          <div className="hidden lg:grid absolute bottom-4 right-4 z-10 grid-cols-2 gap-2 w-[200px]">
            {gridPhotos.map((photo, i) => (
              <motion.div
                key={photo}
                className="
                  relative rounded-xl overflow-hidden
                  shadow-[var(--shadow-sm)]
                  border-2 border-white/20 hover:border-white/40
                  transition-[border-color] duration-200
                  cursor-pointer aspect-square
                "
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <Image
                  src={photo}
                  alt={`${title} photo ${i + 2}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Mobile secondary photos: horizontal scroll carousel */}
      {gridPhotos.length > 0 && (
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 px-[var(--section-pad-x)] pt-2 snap-x snap-mandatory scrollbar-none">
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
  );
}
