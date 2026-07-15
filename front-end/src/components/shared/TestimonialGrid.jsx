export default function TestimonialGrid({ heading = "Reviews", testimonials }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] underline decoration-[var(--color-ink)] underline-offset-4">
        {heading}
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className={`border border-[var(--color-ink)] p-4 transition-colors duration-150 ${
  t.inverted
    ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
    : "bg-[var(--color-bg)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
}`}          >
            <p className="text-[13px] leading-relaxed">"{t.quote}"</p>
            <p className="mt-3 text-[13px] font-semibold">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
