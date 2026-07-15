import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import StatBand from "../../components/shared/StatBand";

const timeline = [
  { year: "2022", label: "Founded" },
  { year: "2023", label: "First 100 teams onboard" },
  { year: "2025", label: "Tatua Sasa AI launched" },
  { year: "2026", label: "Serving teams across East Africa" },
];

const values = [
  { title: "Simplicity first", desc: "If it needs a manual, it's not done yet." },
  { title: "Built with technicians", desc: "Every feature is tested by the people who'll use it daily." },
  { title: "Honest support", desc: "We answer our own support tickets, too." },
];

const leaders = [
  { name: "Esther W.", role: "Co-founder, CEO" },
  { name: "David K.", role: "Co-founder, CTO" },
  { name: "Aisha M.", role: "Head of Product" },
];

export default function AboutUsPage() {
  return (
    <article>
      <PageBreadcrumb text="Tools / About us" />

      <section className="mx-auto max-w-[640px] px-6 pb-6 pt-6 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">Learn who we are and what drives us</h1>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          Tatua Sasa was built by people who've sat in the support seat — we build the tools we
          always wished we had.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <p className="mb-3.5 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Our story
        </p>
        <div className="flex justify-between border-t border-[var(--color-ink)] pt-3.5">
          {timeline.map((t) => (
            <div key={t.year} className="flex-1 text-center">
              <p className="text-[16px] font-bold">{t.year}</p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <div className="grid grid-cols-1 border border-[var(--color-ink)] md:grid-cols-3">
          {values.map((v, i) => (
            <div
              key={v.title}
              className={`p-4.5 ${i < values.length - 1 ? "md:border-r border-[var(--color-line)]" : ""}`}
            >
              <p className="text-[13px] font-semibold">{v.title}</p>
              <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Leadership
        </p>
        <div className="grid grid-cols-1 gap-3.5 text-center md:grid-cols-3">
          {leaders.map((l) => (
            <div key={l.name}>
              <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-[#f1efe8]" />
              <p className="text-[12px] font-semibold">{l.name}</p>
              <p className="text-[10px] text-[var(--color-muted)]">{l.role}</p>
            </div>
          ))}
        </div>
      </section>

      <StatBand
        stats={[
          { value: "1,000+", label: "Teams served" },
          { value: "14", label: "Countries" },
          { value: "45", label: "People on our team" },
        ]}
      />

      <div className="py-8 text-center">
        <div className="inline-block border border-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold">
          View open roles
        </div>
      </div>
    </article>
  );
}
