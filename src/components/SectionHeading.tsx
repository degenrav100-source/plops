interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeading({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <span className="chip">{eyebrow}</span>
      <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-plops-ink md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-plops-ink/65">{subtitle}</p>}
    </div>
  );
}
