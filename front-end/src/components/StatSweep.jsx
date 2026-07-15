const stats = [
  { value: "24/7", label: "AI coverage" },
  { value: "3 min", label: "First response" },
  { value: "98%", label: "Satisfaction" },
  { value: "10k+", label: "Tickets resolved daily" },
];

export default function StatSweep() {
  return (
    <section>
      <div className="mx-auto max-w-[1280px] px-6 pb-12 text-center">
        <p className="text-[80px] font-bold leading-none tracking-tight md:text-[110px]">
          40<span className="text-[0.5em]">%</span>
        </p>
        <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          faster resolution times, on average
        </p>
      </div>

      <div className="grid grid-cols-2 border-y border-[var(--color-line)] md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-4 py-6 text-center ${
              i < stats.length - 1 ? "border-r border-[var(--color-line)]" : ""
            }`}
          >
            <p className="text-[20px] font-bold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
