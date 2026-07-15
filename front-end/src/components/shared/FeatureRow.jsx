export default function FeatureRow({ eyebrow, title, description, mockup, reverse = false }) {
  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-9 px-6 pb-12 md:grid-cols-2">
      <div className={reverse ? "order-2 md:order-1" : ""}>
        <div className="border border-[var(--color-ink)] p-5">{mockup}</div>
      </div>
      <div className={reverse ? "order-1 md:order-2" : ""}>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-[20px] font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </section>
  );
}
