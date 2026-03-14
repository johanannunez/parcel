import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  height?: number;
  variant?: "primary" | "white";
}

export default function Logo({ height = 36, variant = "primary" }: LogoProps) {
  const src =
    variant === "white"
      ? "/images/logo-white.png"
      : "/images/logo-primary.png";

  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src={src}
        alt="The Parcel Company"
        width={Math.round(height * 3.5)}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  );
}
