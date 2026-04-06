"use client"

import Marquee from "@/components/Marquee"

const ROW_1 = [
  { name: "Airbnb", src: "/images/platforms/airbnb.svg" },
  { name: "Vrbo", src: "/images/platforms/vrbo.svg" },
  { name: "Booking.com", src: "/images/platforms/booking.svg" },
  { name: "Furnished Finder", src: "/images/platforms/furnished-finder.svg" },
  { name: "Hospitable", src: "/images/platforms/hospitable.svg" },
  { name: "Turno", src: "/images/platforms/turno-tm.png" },
  { name: "TurboTenant", src: "/images/platforms/turbotenant.svg" },
  { name: "Marriott Bonvoy", src: "/images/platforms/marriott.svg" },
  { name: "KAYAK", src: "/images/platforms/kayak.svg" },
]

const ROW_2 = [
  { name: "HomeToGo", src: "/images/platforms/hometogo.svg" },
  { name: "Holidu", src: "/images/platforms/holidu.svg" },
  { name: "Trivago", src: "/images/platforms/trivago.svg" },
  { name: "HousingAnywhere", src: "/images/platforms/housinganywhere.svg" },
  { name: "Plum Guide", src: "/images/platforms/plum-guide.svg" },
  { name: "Hipcamp", src: "/images/platforms/hipcamp.png" },
  { name: "ALE Solutions", src: "/images/platforms/ale-solutions.svg" },
  { name: "Alacrity", src: "/images/platforms/alacrity.svg" },
]

export default function TrustedPlatforms() {
  return (
    <section className="py-10 md:py-14">
      <p className="text-label text-center mb-8 text-warm-gray-400">
        Trusted by property managers listing on
      </p>

      <Marquee speed={30} direction="left" pauseOnHover fadeEdges fadeWidth={80} gap={64}>
        {ROW_1.map((platform) => (
          <img
            key={platform.name}
            src={platform.src}
            alt={platform.name}
            className="trust-logo"
            style={{
              height: "36px",
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              transition: "opacity 0.3s ease",
            }}
          />
        ))}
      </Marquee>

      <div className="h-7" />

      <Marquee speed={25} direction="right" pauseOnHover fadeEdges fadeWidth={80} gap={64}>
        {ROW_2.map((platform) => (
          <img
            key={platform.name}
            src={platform.src}
            alt={platform.name}
            className="trust-logo"
            style={{
              height: "36px",
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              transition: "opacity 0.3s ease",
            }}
          />
        ))}
      </Marquee>

      <style>{`
        .trust-logo {
          opacity: 0.55;
        }
        .trust-logo:hover {
          opacity: 1 !important;
        }
        :root.dark .trust-logo {
          filter: invert(1) grayscale(1);
          opacity: 0.5;
        }
        :root.dark .trust-logo:hover {
          filter: invert(1) grayscale(0);
          opacity: 0.85 !important;
        }
      `}</style>
    </section>
  )
}
