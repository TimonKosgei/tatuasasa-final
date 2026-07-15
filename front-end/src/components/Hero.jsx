import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-20 pt-24 text-center">
      <span className="inline-block border border-[var(--color-ink)] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
        Now with Tatua Sasa AI
      </span>
      <h1 className="mx-auto mt-5 max-w-[780px] text-[56px] font-bold leading-[1.05] tracking-tight md:text-[72px]">
        Support made simple
      </h1>
      <p className="mx-auto mt-6 max-w-[520px] text-[16px] leading-relaxed text-[var(--color-muted)]">
        Submit, track and resolve support tickets quickly, with real-time
        updates from start to finish.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          to="/get-started"
          className="inline-block border border-[var(--color-ink)] bg-[var(--color-ink)] px-8 py-3.5 text-[15px] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
        >
          Join us
        </Link>
        <Link
          to="/demo"
          className="inline-block border border-[var(--color-ink)] px-8 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
        >
          Watch demo
        </Link>
      </div>
    </section>
  );
}
