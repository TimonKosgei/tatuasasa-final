import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import SimpleCta from "../../components/shared/SimpleCta";

const filters = ["All", "Retail", "Healthcare", "IT services", "Education"];

const reviews = [
  { stars: "★★★★★", quote: "Tatua Desk changed how our team manages support requests.", name: "Sarah M. — Retail" },
  { stars: "★★★★★", quote: "Our technicians finally work from one screen.", name: "Brian K. — IT services", inverted: true },
  { stars: "★★★★☆", quote: "Set up was fast, support during onboarding was excellent.", name: "Amina R. — Healthcare" },
  { stars: "★★★★★", quote: "We catch bottlenecks before they become backlogs.", name: "Tom H. — Education" },
  { stars: "★★★★★", quote: "The knowledge base cut our onboarding time in half.", name: "Christine M. — Retail" },
  { stars: "★★★★★", quote: "Asking the AI beats scrolling through categories.", name: "Halima S. — IT services", inverted: true },
];

export default function CustomerReviewsPage() {
  return (
    <article>
      <PageBreadcrumb text="Tools / Customer reviews" />

      <section className="mx-auto max-w-[640px] px-6 pb-4 pt-6 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">See what our customers have to say</h1>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">
          Real feedback from teams using Tatua Sasa every day, across industries and company sizes.
        </p>
      </section>

      <section className="mx-auto flex max-w-[1280px] justify-center gap-8 px-6 py-6 text-center">
        <div>
          <p className="text-[24px] font-bold">4.8/5</p>
          <p className="text-[10px] uppercase text-[var(--color-muted)]">Average rating</p>
        </div>
        <div>
          <p className="text-[24px] font-bold">1,240</p>
          <p className="text-[10px] uppercase text-[var(--color-muted)]">Reviews collected</p>
        </div>
        <div>
          <p className="text-[24px] font-bold">72</p>
          <p className="text-[10px] uppercase text-[var(--color-muted)]">Net promoter score</p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-2 px-6 pb-8">
        {filters.map((f, i) => (
          <span
            key={f}
                className={`border border-[var(--color-ink)] p-4 ${
  r.inverted ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""
}`}>
            {f}
          </span>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-3.5 px-6 pb-10 md:grid-cols-3">
        {reviews.map((r) => (
          <div
            key={r.name}
            className={`border border-[var(--color-ink)] p-4 ${
              r.inverted ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""
            }`}
          >
            <p className="text-[11px]">{r.stars}</p>
            <p className="mt-2 text-[13px] leading-relaxed">"{r.quote}"</p>
            <p className="mt-2.5 text-[12px] font-semibold">{r.name}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-10 text-center">
        <div className="flex h-[160px] items-center justify-center border border-dashed border-[var(--color-line)] text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Video testimonial placeholder
        </div>
      </section>

      <SimpleCta title="Have a story to share?" />
    </article>
  );
}
