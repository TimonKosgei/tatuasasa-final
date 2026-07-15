export default function AiCallout({ title, description, promptText, responseText }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-14 pb-14">
      <div className="grid grid-cols-1 items-center gap-6 border border-[var(--color-ink)] bg-[var(--color-invert-bg)] p-7 text-[var(--color-invert-ink)] md:grid-cols-2">
        <div>
          <span className="inline-block border border-[var(--color-invert-ink)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
            Tatua Sasa AI
          </span>
          <h3 className="mt-3 text-[20px] font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-invert-muted)]">
            {description}
          </p>
        </div>
        <div className="border border-dashed border-[var(--color-invert-line)] p-3.5">
          {promptText && (
            <>
              <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[var(--color-invert-muted)]">
                Ask Tatua Sasa AI
              </p>
              <div className="mb-2 bg-[#1a1a1a] px-2.5 py-2 text-[11px]">{promptText}</div>
            </>
          )}
          <p className="text-[11px] leading-relaxed text-[var(--color-invert-muted)]">
            {responseText}
          </p>
        </div>
      </div>
    </section>
  );
}
