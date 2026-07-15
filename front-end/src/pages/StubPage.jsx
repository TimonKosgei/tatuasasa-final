import { Link } from "react-router-dom";

export default function StubPage({ title, blurb }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-[34px] font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
        {blurb}
      </p>
      <Link
        to="/"
        className="mt-8 border border-[var(--color-ink)] px-6 py-3 text-[14px] font-semibold transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
      >
        Back to home
      </Link>
    </section>
  );
}
