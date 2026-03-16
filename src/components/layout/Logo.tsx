import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** Icon height in pixels. Text scales proportionally. */
  height?: number;
  /** "primary" = colored icon + dark text. "white" = white icon + white text. */
  variant?: "primary" | "white";
  /** Hide the text, show only the icon mark. */
  iconOnly?: boolean;
}

export default function Logo({
  height = 36,
  variant = "primary",
  iconOnly = false,
}: LogoProps) {
  const iconSrc =
    variant === "white"
      ? "/images/logo-icon-white.png"
      : "/images/logo-icon.png";

  const textColor =
    variant === "white"
      ? "text-white"
      : "text-[var(--text-primary)]";

  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 group"
      aria-label="The Parcel Company, home"
    >
      <Image
        src={iconSrc}
        alt=""
        width={height}
        height={height}
        className="object-contain"
        priority
      />
      {!iconOnly && (
        <span
          className={`font-heading font-bold tracking-tight leading-none ${textColor}`}
          style={{ fontSize: height * 0.44 }}
        >
          The Parcel Company
        </span>
      )}
    </Link>
  );
}
