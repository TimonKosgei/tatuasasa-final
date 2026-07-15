export default function TaglineBand() {
  return (
    <section className="bg-[var(--color-invert-bg)] py-20 text-[var(--color-invert-ink)]">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <p className="text-[26px] font-bold tracking-tight md:text-[34px]">
          FASTER SUPPORT. BETTER SERVICE. GREATER RESULT.
        </p>

        <div
          className="mx-auto mt-12 flex h-[360px] w-full max-w-[960px] items-center justify-center border border-dashed border-[var(--color-invert-line)]"
          role="img"
          aria-label="Placeholder for product screenshot"
        >
          <span className="text-[13px] uppercase tracking-[0.16em] text-[var(--color-invert-muted)]">
            Image goes here
          </span>
        </div>
      </div>
    </section>
  );
}
