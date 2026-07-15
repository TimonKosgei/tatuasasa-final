import { Link } from "react-router-dom";
import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const categories = [
  "Ticketing",
  "Technician fixes",
  "Reports and analytics",
  "Account and billing",
  "Getting started",
];

const featuredArticles = [
  { category: "Technician fixes", title: "Clearing a recurring paper jam on tray 2", time: "4 min read" },
  { category: "Reports and analytics", title: "Why your CSAT score might be misleading", time: "6 min read" },
  { category: "Ticketing", title: "Setting up your first automation rule", time: "3 min read" },
  { category: "Technician fixes", title: "Diagnosing a VPN certificate failure", time: "5 min read" },
  { category: "Account and billing", title: "Updating your payment method", time: "2 min read" },
  { category: "Getting started", title: "Inviting your team to Tatua Sasa", time: "3 min read" },
];

const technicianFixArticles = [
  { title: "Fixing intermittent WiFi drops on the 3rd floor", updated: "Updated 2 days ago" },
  { title: "Replacing a failed fuser unit, step by step", updated: "Updated 5 days ago" },
  { title: "Resetting a locked employee login without IT escalation", updated: "Updated 1 week ago" },
  { title: "Diagnosing slow laptop startup times", updated: "Updated 2 weeks ago" },
  { title: "Resolving duplicate ticket creation from email", updated: "Updated 3 weeks ago" },
];

const reportsArticles = [
  { title: "Understanding your first response time metric", time: "8 min read" },
  { title: "Building a custom dashboard for your team", time: "6 min read" },
  { title: "Why ticket volume spikes on Mondays, and what to do about it", time: "5 min read" },
  { title: "Reading agent performance scores correctly", time: "4 min read" },
];

const popularSearches = [
  "reset password",
  "printer jam",
  "SLA breach",
  "VPN not connecting",
  "export report",
  "invite teammate",
  "billing cycle",
];

export default function KnowledgeBasePage() {
  return (
    <article>
      <PageBreadcrumb text="Services / Knowledge base" />

      <section className="mx-auto max-w-[760px] px-6 pb-8 pt-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Services
        </p>
        <h1 className="mt-2 text-[32px] font-bold tracking-tight">
          Search articles and guides to solve issues quickly
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] text-[13px] text-[var(--color-muted)]">
          Real fixes written by the technicians who solved them, organised so the answer is never
          more than two clicks away.
        </p>
        <div className="mx-auto mt-5 max-w-[440px] border border-[var(--color-ink)] px-4 py-3 text-left text-[12px] text-[var(--color-muted)]">
          Search the knowledge base…
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Browse by category
        </p>
        <div className="grid grid-cols-2 border border-[var(--color-ink)] md:grid-cols-5">
          {categories.map((cat, i) => (
            <div
              key={cat}
              className={`p-4 text-center text-[12px] font-semibold ${
                i < categories.length - 1 ? "border-r border-[var(--color-line)]" : ""
              }`}
            >
              {cat}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Featured articles
        </p>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {featuredArticles.map((a) => (
            <div key={a.title} className="border border-[var(--color-ink)] p-3.5">
              <p className="text-[10px] uppercase text-[var(--color-muted)]">{a.category}</p>
              <p className="mt-1.5 text-[13px] font-semibold">{a.title}</p>
              <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">{a.time}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          How technicians fixed it
        </p>
        <div className="border border-[var(--color-line)]">
          {technicianFixArticles.map((a, i) => (
            <div
              key={a.title}
              className={`flex justify-between px-3.5 py-3 text-[12px] ${
                i < technicianFixArticles.length - 1 ? "border-b border-[var(--color-line)]" : ""
              }`}
            >
              <span>{a.title}</span>
              <span className="text-[var(--color-muted)]">{a.updated}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Reports and analytics articles
        </p>
        <div className="border border-[var(--color-line)]">
          {reportsArticles.map((a, i) => (
            <div
              key={a.title}
              className={`flex justify-between px-3.5 py-3 text-[12px] ${
                i < reportsArticles.length - 1 ? "border-b border-[var(--color-line)]" : ""
              }`}
            >
              <span>{a.title}</span>
              <span className="text-[var(--color-muted)]">{a.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          Popular searches
        </p>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((s) => (
            <span key={s} className="border border-[var(--color-ink)] px-3 py-1.5 text-[11px]">
              {s}
            </span>
          ))}
        </div>
      </section>

      <StatBand
        stats={[
          { value: "340+", label: "Articles published" },
          { value: "62%", label: "Issues self-resolved" },
          { value: "9,200", label: "Searches / month" },
          { value: "4.7", label: "Avg article helpfulness" },
        ]}
      />

      <AiCallout
        title="Ask instead of searching"
        description="Type your problem in plain language and Tatua Sasa AI pulls the exact fix from across every article."
        promptText={'"My VPN keeps disconnecting"'}
        responseText="Based on 3 articles: check certificate expiry first, then confirm your client version is up to date."
      />

      <TestimonialGrid
        testimonials={[
          { quote: "New hires ramp up in days instead of weeks now.", name: "Christine M." },
          { quote: "Most tickets get solved by the customer before they even open one.", name: "Joel R.", inverted: true },
          { quote: "Asking the AI beats scrolling through categories every time.", name: "Halima S." },
        ]}
      />

      <FaqBlock
        items={[
          { question: "Who can write articles?", answer: "Any technician can publish, subject to a quick supervisor review." },
          { question: "Can customers access the knowledge base too?", answer: "Yes, you can choose which categories are public versus internal only." },
        ]}
      />

      <SimpleCta title="Turn every fix into a searchable answer" />

      <div className="mx-auto max-w-[1280px] px-6 pb-10 text-center">
        <Link to="/" className="text-[13px] font-medium underline underline-offset-4 hover:opacity-60">
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
