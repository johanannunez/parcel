import HeroShell from "@/components/hero/HeroShell";
import FloatingPills from "@/components/hero/FloatingPills";
import FloatingBokeh from "@/components/hero/FloatingBokeh";
import FloatingCards from "@/components/hero/FloatingCards";

export default function HeroOptionsPage() {
  return (
    <div>
      {/* Option A */}
      <div className="relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 shadow-lg">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            Option A: Frosted Glass Pills
          </span>
        </div>
        <HeroShell>
          <FloatingPills />
        </HeroShell>
      </div>

      {/* Option B */}
      <div className="relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 shadow-lg">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            Option B: Bokeh / Light Particles
          </span>
        </div>
        <HeroShell>
          <FloatingBokeh />
        </HeroShell>
      </div>

      {/* Option C */}
      <div className="relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 shadow-lg">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            Option C: Review / Stat Cards
          </span>
        </div>
        <HeroShell>
          <FloatingCards />
        </HeroShell>
      </div>

      {/* Option D */}
      <div className="relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 shadow-lg">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            Option D: All Combined
          </span>
        </div>
        <HeroShell>
          <FloatingBokeh />
          <FloatingPills />
          <FloatingCards />
        </HeroShell>
      </div>
    </div>
  );
}
