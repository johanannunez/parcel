interface PropertyDescriptionProps {
  description: string;
}

export default function PropertyDescription({ description }: PropertyDescriptionProps) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-4">
        About this property
      </h2>
      <p className="text-base text-[var(--text-secondary)] font-[family-name:var(--font-body)] leading-relaxed">
        {description}
      </p>
    </section>
  );
}
