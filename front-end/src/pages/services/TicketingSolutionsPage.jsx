import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const trackMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Ticket status</p>
    <div className="flex flex-col gap-1.5 text-[11px]">
      <div className="flex justify-between border border-[var(--color-line)] p-2">
        <span>#2210 Network outage</span>
        <span className="text-[var(--color-muted)]">Open</span>
      </div>
      <div className="flex justify-between border border-[var(--color-line)] bg-[var(--color-ink)] p-2 text-[var(--color-bg)]">
        <span>#2211 Slow VPN</span>
        <span>In progress</span>
      </div>
      <div className="flex justify-between border border-[var(--color-line)] p-2">
        <span>#2212 New hire setup</span>
        <span className="text-[var(--color-muted)]">Resolved</span>
      </div>
    </div>
  </>
);

const applyMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Apply a ticket</p>
    <p className="text-[11px] leading-loose">
      <b>Category</b> Hardware
      <br />
      <b>Priority</b> Medium
      <br />
      <b>Assign to</b> Field team
    </p>
  </>
);

const orgMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Organised by tag</p>
    <div className="flex flex-wrap gap-1.5">
      {["Hardware", "Access", "Billing", "Network", "Onboarding"].map((tag) => (
        <span key={tag} className="border border-[var(--color-ink)] px-2 py-1 text-[10px]">
          {tag}
        </span>
      ))}
    </div>
  </>
);

export default function TicketingSolutionsPage() {
  return (
    <article>
      <PageBreadcrumb text="Services / Ticketing" />
      <PageHero
        eyebrow="Services"
        title="Track and organise tickets. Apply tickets."
        description="A structured way to log, categorise, and apply tickets across teams, so nothing gets duplicated and nothing gets lost."
        mockup={trackMockup}
      />
      <FeatureRow
        eyebrow="Apply tickets"
        title="Attach the right category, priority, and owner in seconds"
        description="A short, guided form keeps every ticket consistent, so reporting and routing both stay accurate."
        mockup={applyMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Stay organised"
        title="Tag it once, find it forever"
        description="Tags make it easy to filter, report on, and hand off tickets, even as your team and ticket volume grow."
        mockup={orgMockup}
      />
      <StatBand
        stats={[
          { value: "0", label: "Tickets lost between systems" },
          { value: "5", label: "Default tag categories" },
          { value: "2 min", label: "Avg time to log a ticket" },
          { value: "100%", label: "Tickets traceable end to end" },
        ]}
      />
      <AiCallout
        title="AI applies the tags for you"
        description="Tatua Sasa AI reads a new ticket and suggests category, priority, and the best team to assign it to."
        responseText={'"This looks like a Network issue, Medium priority — suggest assigning to the Field team."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "Our tagging used to be inconsistent across agents. Not anymore.", name: "Douglas K." },
          { quote: "Applying a ticket now takes seconds, not minutes.", name: "Mercy W.", inverted: true },
          { quote: "We can finally report accurately on ticket categories.", name: "Ian O." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Can I create custom tags?", answer: "Yes, tags are fully customisable per team." },
          { question: "Can a ticket have more than one tag?", answer: "Yes, apply as many tags as are relevant." },
        ]}
      />
      <SimpleCta title="Keep every ticket organised, from day one" />
    </article>
  );
}
