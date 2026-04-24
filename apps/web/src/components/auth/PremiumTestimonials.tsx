const review = {
  quote:
    "Three units on Airbnb and VRBO, and I used to constantly feel behind. Parcel changed that. Every reservation, guest review, and revenue number in one place. My ratings have never been higher because I finally have time to focus on what actually matters.",
  name: "James R.",
  meta: "Tri-Cities, WA · 3 units",
};

export function PremiumTestimonials() {
  return (
    <div style={{ position: "relative" }}>
      {/* Accent blob — bottom right, behind card */}
      <div
        style={{
          position: "absolute",
          width: "190px",
          height: "110px",
          background:
            "linear-gradient(135deg, rgba(2,170,235,0.28) 0%, rgba(27,119,190,0.4) 100%)",
          borderRadius: "62% 38% 55% 45% / 48% 28% 72% 52%",
          bottom: "0px",
          right: "-4px",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.62)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.88)",
          borderRadius: "16px",
          padding: "18px 22px 16px",
          boxShadow: "0 2px 14px rgba(27,119,190,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            fontSize: "44px",
            lineHeight: "0.52",
            color: "var(--color-brand)",
            display: "block",
            marginBottom: "10px",
            opacity: 0.8,
          }}
        >
          &ldquo;
        </span>

        <p
          style={{
            fontSize: "13px",
            color: "#374151",
            lineHeight: "1.65",
            marginBottom: "13px",
            fontWeight: 400,
          }}
        >
          {review.quote}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ color: "#f59e0b", fontSize: "11px", letterSpacing: "1px" }}>
            ★★★★★
          </span>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1a1a" }}>
            {review.name}
          </span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>·</span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>{review.meta}</span>
        </div>
      </div>
    </div>
  );
}
