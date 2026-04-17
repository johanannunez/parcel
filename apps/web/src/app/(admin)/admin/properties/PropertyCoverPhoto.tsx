import { House } from "@phosphor-icons/react/dist/ssr";
import styles from "./PropertyCoverPhoto.module.css";

type Size = "lg" | "md" | "sm";

const DIMENSIONS: Record<Size, { width: number; height: number }> = {
  lg: { width: 260, height: 180 },
  md: { width: 100, height: 100 },
  sm: { width: 44, height: 44 },
};

export function PropertyCoverPhoto({
  src,
  size,
  alt,
  rounded = true,
}: {
  src: string | null;
  size: Size;
  alt: string;
  rounded?: boolean;
}) {
  const { width, height } = DIMENSIONS[size];

  if (src) {
    return (
      <div
        className={`${styles.frame} ${rounded ? styles.rounded : ""} ${styles[size]}`}
        style={{ width, height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
      </div>
    );
  }

  const iconSize = size === "lg" ? 48 : size === "md" ? 22 : 16;

  return (
    <div
      className={`${styles.frame} ${styles.fallback} ${rounded ? styles.rounded : ""} ${styles[size]}`}
      style={{ width, height }}
      aria-label={`${alt} placeholder`}
    >
      <div className={styles.fallbackGradient} aria-hidden />
      <div className={styles.fallbackNoise} aria-hidden />
      <House size={iconSize} weight="duotone" className={styles.fallbackIcon} />
    </div>
  );
}
