import { Link } from "react-router-dom";

const BarChartMock = () => (
  <svg viewBox="0 0 260 90" width="100%" height="90">
    <rect x="0" y="50" width="18" height="40" fill="var(--color-ink)" />
    <rect x="26" y="35" width="18" height="55" fill="var(--color-ink)" />
    <rect x="52" y="42" width="18" height="48" fill="#b4b2a9" />
    <rect x="78" y="20" width="18" height="70" fill="var(--color-ink)" />
    <rect x="104" y="30" width="18" height="60" fill="#b4b2a9" />
    <rect x="130" y="10" width="18" height="80" fill="var(--color-ink)" />
    <rect x="156" y="25" width="18" height="65" fill="#b4b2a9" />
    <rect x="182" y="5" width="18" height="85" fill="var(--color-ink)" />
    <line x1="0" y1="90" x2="260" y2="90" stroke="var(--color-line)" strokeWidth="1" />
  </svg>
);

const LineChartMock = () => (
  <svg viewBox="0 0 260 80" width="100%" height="80">
    <polyline
      points="0,60 40,45 80,50 120,25 160,32 200,12 240,20"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
    />
    <circle cx="240" cy="20" r="3.5" fill="var(--color-ink)" />
    <line x1="0" y1="78" x2="260" y2="78" stroke="var(--color-line)" strokeWidth="1" />
  </svg>
);

const AgentBar = ({ name, pct }) => (
  <div className="flex items-center gap-2">
    <span className="w-[60px] text-[11px]">{name}</span>
    <div className="h-2 flex-1 bg-[#f1efe8]">
      <div className="h-full bg-[var(--color-ink)]" style={{ width: `${pct}%` }} />
    </div>
    <span className="text-[10px] text-[var(--color-muted)]">{pct}%</span>
  </div>
);

const statHeadline = [
  { value: "1,284", label: "Tickets resolved / week" },
  { value: "3m 12s", label: "Average first response" },
  { value: "96%", label: "Customer satisfaction" },
  { value: "12", label: "Custom dashboards built" },
];

const testimonials = [
  {
    quote: "We used to guess where our bottlenecks were. Now we just look at the dashboard.",
    name: "Amina R.",
    inverted: false,
  },
  {
    quote: "Asking the AI a question is faster than building a report ever was.",
    name: "Brian K.",
    inverted: true,
  },
  {
    quote: "Our weekly review meeting is ten minutes now instead of an hour.",
    name: "Sarah M.",
    inverted: false,
  },
];

export default function ReportsAnalyticsPage() {
  return (
    <article>
      <div className="mx-auto max-w-[1280px] px-6 pt-4 text-[11px] text-[var(--color-muted)]">
        Sphere / Reports and analytics
      </div>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-6 pb-12 pt-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Sphere
          </p>
          <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-tight md:text-[42px]">
            Turn insights into better outcomes
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-muted)]">
            See exactly where support is working, and where it isn't. Every
            ticket, every agent, every trend, in one live view.
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

        <div className="border border-[var(--color-ink)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Team overview
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">Last 7 days</span>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="border border-[var(--color-line)] p-2.5">
              <p className="text-[9px] uppercase text-[var(--color-muted)]">Resolved</p>
              <p className="mt-0.5 text-[18px] font-bold">1,284</p>
            </div>
            <div className="border border-[var(--color-line)] p-2.5">
              <p className="text-[9px] uppercase text-[var(--color-muted)]">Avg response</p>
              <p className="mt-0.5 text-[18px] font-bold">3m 12s</p>
            </div>
            <div className="border border-[var(--color-line)] p-2.5">
              <p className="text-[9px] uppercase text-[var(--color-muted)]">CSAT</p>
              <p className="mt-0.5 text-[18px] font-bold">96%</p>
            </div>
          </div>
          <BarChartMock />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-9 px-6 pb-12 md:grid-cols-2">
        <div className="border border-[var(--color-ink)] p-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
            Ticket volume trend
          </p>
          <LineChartMock />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Real-time dashboards
          </p>
          <h3 className="mt-2 text-[20px] font-semibold tracking-tight">
            Watch trends the moment they happen
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
            No end-of-week exports. See ticket volume, response times, and
            satisfaction shift live as your team works.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-9 px-6 pb-14 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Custom reports
          </p>
          <h3 className="mt-2 text-[20px] font-semibold tracking-tight">
            Build the report your team actually needs
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
            Pick the metrics that matter to you and save them as a dashboard
            your whole team can check.
          </p>
        </div>
        <div className="order-1 border border-[var(--color-ink)] p-5 md:order-2">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
            Agent performance
          </p>
          <div className="flex flex-col gap-2">
            <AgentBar name="Amina R." pct={88} />
            <AgentBar name="Brian K." pct={74} />
            <AgentBar name="Sarah M." pct={95} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-14">
        <div className="grid grid-cols-1 items-center gap-6 border border-[var(--color-ink)] bg-[var(--color-invert-bg)] p-7 text-[var(--color-invert-ink)] md:grid-cols-2">
          <div>
            <span className="inline-block border border-[var(--color-invert-ink)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
              Tatua Sasa AI
            </span>
            <h3 className="mt-3 text-[20px] font-semibold tracking-tight">
              Ask your reports a question instead of building one
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-invert-muted)]">
              Type a question like "which agent had the fastest resolutions
              last week" and Tatua Sasa AI tracks it down and explains the
              trend, no dashboard building required.
            </p>
          </div>
          <div className="border border-dashed border-[var(--color-invert-line)] p-3.5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[var(--color-invert-muted)]">
              Ask Tatua Sasa AI
            </p>
            <div className="mb-2 bg-[#1a1a1a] px-2.5 py-2 text-[11px]">
              "Why did response time increase this week?"
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--color-invert-muted)]">
              Response time rose 18% on Tuesday, driven by a spike in tickets
              from the billing category.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-invert-bg)] py-11 text-[var(--color-invert-ink)]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 px-6 text-center md:grid-cols-4">
          {statHeadline.map((s) => (
            <div key={s.label}>
              <p className="text-[24px] font-bold">{s.value}</p>
              <p className="mt-1 text-[11px] text-[var(--color-invert-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] underline decoration-[var(--color-ink)] underline-offset-4">
          Reviews
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`border border-[var(--color-ink)] p-4.5 ${
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

      <section className="border-t border-[var(--color-line)] py-12 text-center">
        <h2 className="text-[20px] font-semibold tracking-tight">
          See your support data clearly
        </h2>
        <Link
          to="/get-started"
          className="mt-4 inline-block bg-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90"
        >
          Try for free
        </Link>
      </section>
    </article>
  );
}
