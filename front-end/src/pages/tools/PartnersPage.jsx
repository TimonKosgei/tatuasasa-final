import PageBreadcrumb from "../../components/shared/PageBreadcrumb";

const partnerTypes = [
  { title: "Technology partners", desc: "Integrate your product with Tatua Sasa's API." },
  { title: "Reseller partners", desc: "Sell Tatua Sasa to your own client base." },
  { title: "Solution partners", desc: "Implement and customise Tatua Sasa for clients." },
];

const benefits = [
  { title: "Revenue share", desc: "Earn on every client you bring onto Tatua Sasa." },
  { title: "Dedicated support", desc: "A direct line to our team, not a ticket queue." },
  { title: "Co-marketing", desc: "Joint case studies and launch announcements." },
  { title: "Early access", desc: "Try new features before general release." },
];

export default function PartnersPage() {
  return (
    <article>
      <PageBreadcrumb text="Tools / Partners" />

      <section className="mx-auto max-w-[640px] px-6 pb-6 pt-6 text-center">
        <h1 className="text-[30px] font-bold tracking-tight">
          Working with trusted partners to deliver reliable support
        </h1>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          We work alongside a network of partners to extend what Tatua Sasa can do for your
          organisation.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <div className="grid grid-cols-1 border border-[var(--color-ink)] text-center md:grid-cols-3">
          {partnerTypes.map((p, i) => (
            <div
              key={p.title}
              className={`p-5 ${i < partnerTypes.length - 1 ? "md:border-r border-[var(--color-line)]" : ""}`}
            >
              <p className="text-[13px] font-semibold">{p.title}</p>
              <p className="mt-2 text-[11px] text-[var(--color-muted)]">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Why partner with us
        </p>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="border border-[var(--color-line)] p-4">
              <p className="text-[12px] font-semibold">{b.title}</p>
              <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10 text-center">
        <p className="mb-3 text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Trusted by partners like
        </p>
        <div className="flex flex-wrap justify-center gap-7 text-[12px] font-semibold text-[#b4b2a9]">
          <span>PARTNER A</span>
          <span>PARTNER B</span>
          <span>PARTNER C</span>
          <span>PARTNER D</span>
        </div>
      </section>

      <section className="border-t border-[var(--color-line)] py-8 text-center">
        <p className="text-[16px] font-semibold">Become a partner</p>
        <div className="mt-3 inline-block bg-[var(--color-ink)] px-6 py-3 text-[13px] font-semibold text-[var(--color-bg)]">
          Apply now
        </div>
      </section>
    </article>
  );
}
