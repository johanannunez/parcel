import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "text-white font-semibold",
    "bg-[image:var(--brand-gradient)]",
    "hover:bg-[image:var(--brand-gradient-hover)]",
    "hover:shadow-[var(--shadow-brand)]",
    "active:scale-[0.97]",
  ].join(" "),
  secondary: [
    "bg-[var(--surface)] text-[var(--text-primary)]",
    "border border-[var(--border)]",
    "hover:bg-[var(--surface-hover)]",
    "active:bg-[var(--surface-active)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--text-secondary)]",
    "hover:bg-[var(--surface-hover)]",
    "active:bg-[var(--surface-active)]",
  ].join(" "),
  outline: [
    "bg-transparent text-[var(--brand-bright)]",
    "border border-[var(--brand-bright)]",
    "hover:bg-[var(--brand-bright)] hover:text-white",
    "active:scale-[0.97]",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-base gap-2",
  lg: "px-8 py-4 text-lg gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center",
    "rounded-full font-[family-name:var(--font-heading)] font-semibold",
    "transition-[background,color,border-color,box-shadow,transform,opacity] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
    "cursor-pointer select-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
