import { Link } from "react-router-dom";

export default function PageHero({ eyebrow, title, description, mockup }) {
  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-6 pb-12 pt-6 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight md:text-[42px]">
          {title}
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/get-started"
            className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
          >
            Try for free
          </Link>
          <Link
            to="/demo"
            className="border border-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
          >
            Watch demo
          </Link>
        </div>
      </div>

      <div className="border border-[var(--color-ink)] p-4">{mockup}</div>
    </section>
  );
}
