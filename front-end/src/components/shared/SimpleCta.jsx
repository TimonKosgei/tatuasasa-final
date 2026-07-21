import { Link } from "react-router-dom";

export default function SimpleCta({ title }) {
  return (
    <section className="border-t border-[var(--color-line)] py-12 text-center">
      <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
      <Link
  to="/get-started"
  className="mt-4 inline-block border border-[var(--color-ink)] bg-[var(--color-bg)] px-6 py-3 text-[13px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
>
  Join us
</Link>    </section>
  );
}