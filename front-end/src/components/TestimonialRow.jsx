const testimonials = [
  {
    quote:
      "Faster response times and much better communication across our departments.",
    name: "Sarah M.",
    inverted: false,
  },
  {
    quote:
      "Our technicians finally work from one screen instead of five tabs.",
    name: "Brian K.",
    inverted: true,
  },
  {
    quote: "We catch bottlenecks before they become backlogs now.",
    name: "Amina R.",
    inverted: false,
  },
];

export default function TestimonialRow() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] underline decoration-[var(--color-ink)] underline-offset-4">
        Reviews
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className={`border border-[var(--color-ink)] p-5 ${
              t.inverted
                ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
                : "bg-[var(--color-bg)] text-[var(--color-ink)]"
            }`}
          >
            <p className="text-[13px] leading-relaxed">"{t.quote}"</p>
            <p className="mt-3 text-[13px] font-semibold">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
