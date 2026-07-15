const filters = ["All", "Product", "AI", "Customer stories", "Company news"];

const posts = [
  { category: "Customer stories", title: "How one retail chain cut resolution time by 40%" },
  { category: "Product", title: "5 automation rules every support team should set up" },
  { category: "Company news", title: "Tatua Sasa raises seed round to expand across East Africa" },
  { category: "Product", title: "Workforce management 101: balancing shifts fairly" },
  { category: "AI", title: "What our AI can and can't do (yet)" },
  { category: "Customer stories", title: "Scaling from 2 to 40 technicians without losing control" },
];

import PageBreadcrumb from "../../components/shared/PageBreadcrumb";

export default function BlogPage() {
  return (
    <article>
      <PageBreadcrumb text="Tools / Blog" />

      <section className="mx-auto max-w-[640px] px-6 pb-4 pt-6 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">
          Explore insights, tips, and updates
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">
          Ideas and playbooks for building better support operations.
        </p>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-2 px-6 pb-8">
        {filters.map((f, i) => (
          <span
            key={f}
            className={`border border-[var(--color-ink)] px-3 py-1.5 text-[11px] ${
              i === 0 ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""
            }`}
          >
            {f}
          </span>
        ))}
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-8">
        <div className="grid grid-cols-1 items-center gap-5 border border-[var(--color-ink)] p-5 md:grid-cols-2">
          <div className="flex h-[120px] items-center justify-center border border-dashed border-[var(--color-line)] text-[10px] text-[var(--color-muted)]">
            Featured image
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted)]">Featured — AI</p>
            <p className="mt-1.5 text-[18px] font-semibold">
              How Tatua Sasa AI reads a ticket before your team does
            </p>
            <p className="mt-2 text-[12px] text-[var(--color-muted)]">
              A look at how automatic tagging and drafted replies actually work under the hood.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-3.5 px-6 pb-10 md:grid-cols-3">
        {posts.map((p) => (
          <div key={p.title} className="border border-[var(--color-ink)] p-3.5">
            <p className="text-[10px] uppercase text-[var(--color-muted)]">{p.category}</p>
            <p className="mt-1.5 text-[13px] font-semibold">{p.title}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-[var(--color-line)] px-6 py-8 text-center">
        <p className="text-[16px] font-semibold">Get new posts in your inbox</p>
        <div className="mt-3 flex justify-center gap-2">
          <div className="w-[220px] border border-[var(--color-ink)] px-3.5 py-2.5 text-left text-[12px] text-[var(--color-muted)]">
            you@company.com
          </div>
          <div className="bg-[var(--color-ink)] px-4 py-2.5 text-[12px] font-semibold text-[var(--color-bg)]">
            Subscribe
          </div>
        </div>
      </section>
    </article>
  );
}
