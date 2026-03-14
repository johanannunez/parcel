import Image from "next/image";
import HeroContent from "./HeroContent";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Background image */}
      <Image
        src={HERO_IMAGE}
        alt="Beautiful vacation home in Washington state"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      {/* Content (client component for motion animations) */}
      <HeroContent />
    </section>
  );
}
