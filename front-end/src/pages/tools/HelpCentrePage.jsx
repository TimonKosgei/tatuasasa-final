import PageBreadcrumb from "../../components/shared/PageBreadcrumb";

const categories = [
  "Getting started",
  "Ticketing",
  "Billing",
  "Account settings",
  "Troubleshooting",
  "API and integrations",
];

const popularArticles = [
  { title: "How to reset your password", time: "2 min" },
  { title: "Setting up your first automation rule", time: "3 min" },
  { title: "Understanding your invoice", time: "2 min" },
];

const channels = [
  { title: "Live chat", desc: "Talk to a real person now" },
  { title: "Email support", desc: "Reply within a few hours" },
  { title: "Community forum", desc: "Ask other Tatua Sasa users" },
];

export default function HelpCentrePage() {
  return (
    <article>
      <PageBreadcrumb text="Tools / Help centre" />

      <section className="mx-auto max-w-[640px] px-6 pb-6 pt-6 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">
          Find help fast with our support resources
        </h1>
        <div className="mx-auto mt-5 max-w-[440px] border border-[var(--color-ink)] px-4 py-3 text-left text-[12px] text-[var(--color-muted)]">
          Search for an answer…
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <div className="grid grid-cols-2 border border-[var(--color-ink)] md:grid-cols-3">
          {categories.map((cat, i) => (
            <div
              key={cat}
              className={`p-4 text-[13px] font-semibold ${
                i % 3 !== 2 ? "border-r border-[var(--color-line)]" : ""
              } ${i < 3 ? "border-b border-[var(--color-line)]" : ""}`}
            >
              {cat}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Most viewed this week
        </p>
        <div className="border border-[var(--color-line)]">
          {popularArticles.map((a, i) => (
            <div
              key={a.title}
              className={`flex justify-between px-3.5 py-3 text-[12px] ${
                i < popularArticles.length - 1 ? "border-b border-[var(--color-line)]" : ""
              }`}
            >
              <span>{a.title}</span>
              <span className="text-[var(--color-muted)]">{a.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-3.5 px-6 pb-10 text-center md:grid-cols-3">
        {channels.map((c) => (
          <div key={c.title} className="border border-[var(--color-ink)] p-4.5">
            <p className="text-[13px] font-semibold">{c.title}</p>
            <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">{c.desc}</p>
          </div>
        ))}
      </section>

      <div className="border-t border-[var(--color-line)] py-3.5 text-center text-[11px] text-[var(--color-muted)]">
        All systems operational — view status page
      </div>
    </article>
  );
}
