export default function StatBand({ stats }) {
  return (
    <section className="bg-[var(--color-invert-bg)] py-11 text-[var(--color-invert-ink)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 px-6 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[22px] font-bold">{s.value}</p>
            <p className="mt-1 text-[10px] text-[var(--color-invert-muted)]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
