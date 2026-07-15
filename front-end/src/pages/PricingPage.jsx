import { useState } from "react";
import { Link } from "react-router-dom";

const packages = [
  {
    key: "technician",
    title: "Technician",
    subtitle: "For the people doing the fixing",
    price: "$8",
    period: "/technician / month",
    features: [
      "Ticket queue and history",
      "Mobile job updates",
      "Saved replies",
      "Knowledge base access",
    ],
  },
  {
    key: "supervisor",
    title: "Supervisor",
    subtitle: "For the people managing the team",
    price: "$19",
    period: "/supervisor / month",
    features: [
      "Everything in Technician",
      "Team workload view",
      "Performance tracking",
      "Shift scheduling",
    ],
  },
  {
    key: "company",
    title: "Company",
    subtitle: "For the whole organisation",
    price: "Custom",
    period: "billed annually",
    features: [
      "Everything in Supervisor",
      "Company-wide analytics",
      "Tatua Sasa AI included",
      "Dedicated account manager",
    ],
  },
];

const comparisonRows = [
  { feature: "Ticketing and chat", technician: true, supervisor: true, company: true },
  { feature: "Team workload view", technician: false, supervisor: true, company: true },
  { feature: "Tatua Sasa AI", technician: false, supervisor: false, company: true },
];

function PriceCard({ pkg }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`cursor-pointer border border-[var(--color-ink)] p-6 text-center transition-colors duration-150 ${
        hovered ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : "bg-[var(--color-bg)] text-[var(--color-ink)]"
      }`}
    >
      <p className="text-[15px] font-bold">{pkg.title}</p>
      <p className={`mt-1.5 text-[11px] ${hovered ? "text-[var(--color-invert-muted)]" : "text-[var(--color-muted)]"}`}>
        {pkg.subtitle}
      </p>

      <p className="mt-5 text-[26px] font-bold">
        {hovered ? pkg.price : "—"}
      </p>
      {hovered && (
        <p className="text-[11px] text-[var(--color-invert-muted)]">{pkg.period}</p>
      )}

      <div className={`mt-3 text-[11px] leading-[1.8] ${hovered ? "text-[var(--color-invert-muted)]" : "text-[var(--color-muted)]"}`}>
        {hovered
          ? pkg.features.map((f) => <p key={f}>{f}</p>)
          : "Hover to see pricing"}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <article>
      <section className="mx-auto max-w-[640px] px-6 pb-2 pt-8 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">Simple pricing for every role</h1>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">
          Hover a package to see what's included.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-6 py-10 md:grid-cols-3">
        {packages.map((pkg) => (
          <PriceCard key={pkg.key} pkg={pkg} />
        ))}
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-12">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Compare plans
        </p>
        <div className="border border-[var(--color-ink)]">
          <div className="grid grid-cols-4 border-b border-[var(--color-line)] text-[11px] font-semibold">
            <div className="p-2.5 pl-3.5">Feature</div>
            <div className="p-2.5 text-center">Technician</div>
            <div className="p-2.5 text-center">Supervisor</div>
            <div className="p-2.5 text-center">Company</div>
          </div>
          {comparisonRows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 text-[11px] ${
                i < comparisonRows.length - 1 ? "border-b border-[var(--color-line)]" : ""
              }`}
            >
              <div className="p-2 pl-3.5">{row.feature}</div>
              <div className={`p-2 text-center ${!row.technician ? "text-[#c9c7bd]" : ""}`}>
                {row.technician ? "✓" : "—"}
              </div>
              <div className={`p-2 text-center ${!row.supervisor ? "text-[#c9c7bd]" : ""}`}>
                {row.supervisor ? "✓" : "—"}
              </div>
              <div className={`p-2 text-center ${!row.company ? "text-[#c9c7bd]" : ""}`}>
                {row.company ? "✓" : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-14 text-center">
        <Link
          to="/get-started"
          className="inline-block bg-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90"
        >
          Try for free
        </Link>
      </section>
    </article>
  );
}
