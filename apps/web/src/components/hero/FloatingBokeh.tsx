"use client";

interface BokehOrb {
  id: string;
  size: number;
  x: string;
  y: string;
  opacity: number;
  color: string;
  driftClass: string;
}

const ORBS: BokehOrb[] = [
  { id: "b01", size: 180, x: "5%",  y: "5%",  opacity: 0.08, color: "rgba(2,170,235,0.4)",   driftClass: "bk-drift-1" },
  { id: "b02", size: 90,  x: "85%", y: "10%", opacity: 0.12, color: "rgba(255,255,255,0.3)", driftClass: "bk-drift-3" },
  { id: "b03", size: 50,  x: "78%", y: "30%", opacity: 0.1,  color: "rgba(2,170,235,0.35)",  driftClass: "bk-drift-5" },
  { id: "b04", size: 140, x: "0%",  y: "40%", opacity: 0.06, color: "rgba(255,255,255,0.25)", driftClass: "bk-drift-2" },
  { id: "b05", size: 35,  x: "92%", y: "50%", opacity: 0.15, color: "rgba(255,255,255,0.35)", driftClass: "bk-drift-4" },
  { id: "b06", size: 70,  x: "8%",  y: "65%", opacity: 0.1,  color: "rgba(27,119,190,0.3)",  driftClass: "bk-drift-6" },
  { id: "b07", size: 110, x: "88%", y: "68%", opacity: 0.07, color: "rgba(2,170,235,0.3)",   driftClass: "bk-drift-1" },
  { id: "b08", size: 45,  x: "3%",  y: "22%", opacity: 0.12, color: "rgba(255,255,255,0.3)", driftClass: "bk-drift-4" },
  { id: "b09", size: 60,  x: "90%", y: "82%", opacity: 0.08, color: "rgba(255,255,255,0.2)", driftClass: "bk-drift-3" },
  { id: "b10", size: 25,  x: "12%", y: "78%", opacity: 0.14, color: "rgba(2,170,235,0.35)",  driftClass: "bk-drift-5" },
  { id: "b11", size: 160, x: "82%", y: "45%", opacity: 0.05, color: "rgba(27,119,190,0.25)", driftClass: "bk-drift-2" },
  { id: "b12", size: 30,  x: "6%",  y: "52%", opacity: 0.13, color: "rgba(255,255,255,0.3)", driftClass: "bk-drift-6" },
];

export default function FloatingBokeh() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {ORBS.map((orb) => (
        <div
          key={orb.id}
          className={orb.driftClass}
          style={{
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            opacity: orb.opacity,
            filter: "blur(8px)",
          }}
        />
      ))}
      <style>{`
        @keyframes bk-drift-1 { 0%{transform:translate(0,0)} 33%{transform:translate(30px,20px)} 66%{transform:translate(-20px,30px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-2 { 0%{transform:translate(0,0)} 33%{transform:translate(-25px,-18px)} 66%{transform:translate(18px,-12px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-3 { 0%{transform:translate(0,0)} 50%{transform:translate(22px,-16px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-4 { 0%{transform:translate(0,0)} 40%{transform:translate(-14px,22px)} 80%{transform:translate(16px,10px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-5 { 0%{transform:translate(0,0)} 35%{transform:translate(18px,-14px)} 70%{transform:translate(-10px,-20px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-6 { 0%{transform:translate(0,0)} 50%{transform:translate(-24px,14px)} 100%{transform:translate(0,0)} }
        .bk-drift-1{animation:bk-drift-1 28s ease-in-out infinite}
        .bk-drift-2{animation:bk-drift-2 22s ease-in-out infinite}
        .bk-drift-3{animation:bk-drift-3 30s ease-in-out infinite}
        .bk-drift-4{animation:bk-drift-4 24s ease-in-out infinite}
        .bk-drift-5{animation:bk-drift-5 20s ease-in-out infinite}
        .bk-drift-6{animation:bk-drift-6 26s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.bk-drift-1,.bk-drift-2,.bk-drift-3,.bk-drift-4,.bk-drift-5,.bk-drift-6{animation:none}}
      `}</style>
    </div>
  );
}
