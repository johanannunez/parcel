"use client";

import { Star } from "@phosphor-icons/react";

interface ReviewCard {
  id: string;
  quote: string;
  author: string;
  location: string;
  rating: number;
  x: string;
  y: string;
  rotation: number;
  driftClass: string;
}

const CARDS: ReviewCard[] = [
  {
    id: "c01",
    quote: "Absolutely stunning property. Felt right at home!",
    author: "Ana",
    location: "Airbnb Guest",
    rating: 5,
    x: "1%", y: "14%", rotation: -2, driftClass: "fc-drift-1",
  },
  {
    id: "c02",
    quote: "Amazing host. Went above and beyond for us.",
    author: "Janna",
    location: "Lake Tapps, WA",
    rating: 5,
    x: "82%", y: "16%", rotation: 3, driftClass: "fc-drift-4",
  },
  {
    id: "c03",
    quote: "A great home away from home.",
    author: "Brandon",
    location: "Chandler, AZ",
    rating: 5,
    x: "84%", y: "48%", rotation: -2, driftClass: "fc-drift-2",
  },
  {
    id: "c04",
    quote: "Very clean and perfect for our group.",
    author: "Kayla",
    location: "Seattle, WA",
    rating: 5,
    x: "0%", y: "46%", rotation: 2, driftClass: "fc-drift-5",
  },
  {
    id: "c05",
    quote: "51 five-star reviews",
    author: "",
    location: "",
    rating: 0,
    x: "86%", y: "76%", rotation: -3, driftClass: "fc-drift-3",
  },
  {
    id: "c06",
    quote: "Jo was helpful, responsive, and very pleasant.",
    author: "J.",
    location: "Everett, WA",
    rating: 5,
    x: "2%", y: "76%", rotation: 3, driftClass: "fc-drift-6",
  },
];

export default function FloatingCards() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden md:block">
      {CARDS.map((card) => (
        <div
          key={card.id}
          className={`fc-card ${card.driftClass}`}
          style={{ position: "absolute", left: card.x, top: card.y, transform: `rotate(${card.rotation}deg)` }}
        >
          {card.rating > 0 && (
            <div className="fc-stars">
              {Array.from({ length: card.rating }).map((_, i) => (
                <Star key={i} size={11} weight="fill" style={{ color: "var(--color-star)" }} />
              ))}
            </div>
          )}
          <p className="fc-quote">{card.quote}</p>
          {card.author && <span className="fc-author">{card.author}{card.location ? ` · ${card.location}` : ""}</span>}
        </div>
      ))}
      <style>{`
        .fc-card {
          max-width: 190px; padding: 12px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.18);
          opacity: 0.45; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .fc-stars { display:flex; gap:2px; margin-bottom:5px; }
        .fc-quote { color:rgba(255,255,255,0.85); font-size:12px; line-height:1.45; font-weight:500; }
        .fc-author { display:block; margin-top:5px; color:rgba(255,255,255,0.5); font-size:11px; font-weight:400; }
        @keyframes fc-drift-1 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(16px,8px) rotate(1deg)} 66%{transform:translate(-8px,16px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-2 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(-12px,-10px) rotate(-1.5deg)} 66%{transform:translate(10px,-4px) rotate(0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-3 { 0%{transform:translate(0,0)} 50%{transform:translate(12px,-8px)} 100%{transform:translate(0,0)} }
        @keyframes fc-drift-4 { 0%{transform:translate(0,0) rotate(0deg)} 40%{transform:translate(-6px,12px) rotate(0.5deg)} 80%{transform:translate(8px,4px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-5 { 0%{transform:translate(0,0)} 35%{transform:translate(10px,-6px)} 70%{transform:translate(-4px,-12px)} 100%{transform:translate(0,0)} }
        @keyframes fc-drift-6 { 0%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-14px,6px) rotate(1.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        .fc-drift-1{animation:fc-drift-1 24s ease-in-out infinite}
        .fc-drift-2{animation:fc-drift-2 20s ease-in-out infinite}
        .fc-drift-3{animation:fc-drift-3 28s ease-in-out infinite}
        .fc-drift-4{animation:fc-drift-4 22s ease-in-out infinite}
        .fc-drift-5{animation:fc-drift-5 18s ease-in-out infinite}
        .fc-drift-6{animation:fc-drift-6 26s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.fc-drift-1,.fc-drift-2,.fc-drift-3,.fc-drift-4,.fc-drift-5,.fc-drift-6{animation:none}}
      `}</style>
    </div>
  );
}
