"use client";

/**
 * Tiny inline SVG icons for booking platform logos.
 * Renders at 12x12 by default. Each logo is a simplified, recognizable
 * mark using the platform's brand color.
 */
export function PlatformIcon({
  source,
  size = 12,
  color,
}: {
  source: string;
  size?: number;
  color: string;
}) {
  switch (source) {
    case "airbnb":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          aria-label="Airbnb"
          role="img"
        >
          <path d="M12.001 18.5c-1.3-1.7-2.3-3.3-3-4.7-.7-1.5-1-2.7-1-3.6 0-1.2.4-2.2 1.1-2.9.6-.6 1.4-.9 2.3-.9h.1c.9 0 1.8.3 2.4.9.7.7 1.1 1.7 1.1 2.9 0 .9-.4 2.2-1.1 3.6-.7 1.5-1.6 3.1-2.9 4.7zm7.5-1.2c-.3 1.4-1.5 2.5-3 2.7-.7.1-1.4 0-2.1-.3-.6-.3-1.2-.8-1.8-1.4 1.5-1.8 2.6-3.5 3.4-5.1.8-1.6 1.2-3 1.2-4.2 0-1.7-.6-3.1-1.7-4.1C14.4 3.9 13.2 3.4 12 3.4s-2.4.5-3.4 1.5c-1.1 1-1.7 2.4-1.7 4.1 0 1.2.4 2.6 1.2 4.2.8 1.6 1.9 3.3 3.4 5.1-.6.6-1.2 1.1-1.8 1.4-.7.3-1.3.4-2.1.3-1.5-.2-2.7-1.3-3-2.7-.2-.8-.1-1.7.2-2.8.3-1 .9-2.3 1.7-3.8 1-1.8 2.4-3.8 4.2-6.2l.2-.2.3-.4h.1l.4.4.2.2c1.8 2.3 3.3 4.4 4.2 6.2.9 1.5 1.4 2.8 1.7 3.8.4 1.1.5 2 .3 2.8z" />
        </svg>
      );

    case "vrbo":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="VRBO"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color} />
          <path
            d="M5 8l3.5 8h1L12 9.5 14.5 16h1L19 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );

    case "booking_com":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Booking.com"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color} />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            B
          </text>
        </svg>
      );

    case "hospitable":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Hospitable"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color} />
          <path
            d="M7 14c0-2.8 2.2-5 5-5s5 2.2 5 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="10" r="2" fill="white" />
        </svg>
      );

    case "furnished_finder":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Furnished Finder"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color} />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            FF
          </text>
        </svg>
      );

    case "direct":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Direct booking"
          role="img"
        >
          <rect width="24" height="24" rx="4" fill={color} />
          <path
            d="M8 12h8M12 8v8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Booking"
          role="img"
        >
          <circle cx="12" cy="12" r="12" fill={color} />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      );
  }
}
