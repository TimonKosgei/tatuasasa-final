import { Link } from "react-router-dom";

export default function ClosingCta() {
  return (
    <section className="bg-[var(--color-invert-bg)] py-14 text-center text-[var(--color-invert-ink)]">
      <h2 className="text-[24px] font-semibold tracking-tight">
        Ready to simplify your support desk?
      </h2>
      <Link
        to="/get-started"
        className="mt-5 inline-block bg-[var(--color-invert-ink)] px-7 py-3.5 text-[14px] font-semibold text-[var(--color-invert-bg)] transition-opacity hover:opacity-90"
      >
        Try for free
      </Link>
    </section>
  );
}