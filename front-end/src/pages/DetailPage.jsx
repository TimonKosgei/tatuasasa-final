import { useParams, Link, Navigate } from "react-router-dom";
import { findItem } from "../data/navData";

export default function DetailPage() {
  const { section: sectionKey, slug } = useParams();
  const found = findItem(sectionKey, slug);

  if (!found) return <Navigate to="/" replace />;
  const { section, item } = found;

  const otherItems = section.items.filter((i) => i.slug !== slug);

  return (
    <article className="mx-auto max-w-[760px] px-6 py-20">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {section.label}
      </p>
      <h1 className="mt-3 text-[38px] font-bold leading-tight tracking-tight md:text-[46px]">
        {item.title}
      </h1>
      <p className="mt-4 text-[17px] font-medium text-[var(--color-muted)]">
        {item.tagline}
      </p>

      <div className="my-10 h-px w-full bg-[var(--color-line)]" />

      <p className="text-[16px] leading-relaxed text-[var(--color-ink)]">
        {item.body}
      </p>

      <Link
        to="/get-started"
        className="mt-10 inline-block border border-[var(--color-ink)] bg-[var(--color-ink)] px-7 py-3 text-[14px] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
      >
        Try for free
      </Link>

      {otherItems.length > 0 && (
        <div className="mt-20">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            More in {section.label}
          </p>
          <div className="mt-4 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-2">
            {otherItems.map((other) => (
              <Link
                key={other.slug}
                to={`/${section.key}/${other.slug}`}
                className="bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
              >
                <p className="text-[15px] font-semibold">{other.title}</p>
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                  {other.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16">
        <Link
          to="/"
          className="text-[14px] font-medium underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
