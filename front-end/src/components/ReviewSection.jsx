import { Link } from "react-router-dom";

export default function ReviewSection() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="text-[26px] font-semibold tracking-tight md:text-[30px]">
          Powering support at every scale
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          Whether you're just getting started or managing thousands of
          requests, our platform helps your team stay efficient.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-[640px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] underline decoration-[var(--color-ink)] underline-offset-4">
          Review
        </p>

        <div className="mt-6 border border-[var(--color-ink)] p-8">
          <p className="text-[15px] font-semibold">Sarah M.</p>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
            "Tatua Desk has completely changed the way our team manages
            support requests. The platform is intuitive, easy to navigate,
            and keeps every ticket organized from submission to resolution.
            We've seen faster response times and much better communication
            across our departments."
          </p>

          <Link
            to="/blog/sarah-m-review"
            className="mt-6 inline-block text-[14px] font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
          >
            Read article →
          </Link>
        </div>
      </div>
    </section>
  );
}