import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const inboxMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Unified inbox</p>
    <div className="flex flex-col gap-1.5">
      {[
        { label: "#1042 Billing issue", tag: "Email", active: false },
        { label: "#1043 Login not working", tag: "Chat", active: true },
        { label: "#1044 Refund request", tag: "Twitter", active: false },
        { label: "#1045 Feature question", tag: "Email", active: false },
      ].map((row) => (
        <div
          key={row.label}
          className={`flex justify-between border border-[var(--color-line)] p-2 text-[11px] ${
            row.active ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""
          }`}
        >
          <span>{row.label}</span>
          <span className={row.active ? "text-[var(--color-invert-muted)]" : "text-[var(--color-muted)]"}>
            {row.tag}
          </span>
        </div>
      ))}
    </div>
  </>
);

const automationMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Automation rule</p>
    <p className="text-[11px] leading-loose">
      <b>When</b> ticket tagged "urgent"
      <br />
      <b>Then</b> assign to on-call agent
      <br />
      <b>And</b> notify supervisor
    </p>
  </>
);

const noteMockup = (
  <>
    <p className="mb-2 text-[10px] text-[var(--color-muted)]">Internal note</p>
    <div className="bg-[#f7f7f7] p-2 text-[11px]">
      @Brian can you confirm the refund amount before I reply?
    </div>
  </>
);

export default function TicketingPage() {
  return (
    <article>
      <PageBreadcrumb text="Product / Ticketing" />
      <PageHero
        eyebrow="Product"
        title="Every ticket, tracked from first message to resolution"
        description="Requests come in from email, chat, and social. Tatua Sasa pulls them into one queue so nothing falls through, and nothing gets duplicated."
        mockup={inboxMockup}
      />
      <FeatureRow
        eyebrow="Automation and SLAs"
        title="Let the rules handle routing, not your agents"
        description="Auto-assign by category, escalate when a reply is overdue, and set SLAs that alert someone before a deadline is missed."
        mockup={automationMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Collaboration"
        title="Loop in a teammate without leaving the ticket"
        description="Internal notes and @mentions keep conversations with your team separate from the customer, but right next to the ticket."
        mockup={noteMockup}
      />
      <StatBand
        stats={[
          { value: "1,284", label: "Tickets / week" },
          { value: "42%", label: "Fewer duplicate tickets" },
          { value: "3m 12s", label: "First response time" },
          { value: "98%", label: "SLA compliance" },
        ]}
      />
      <AiCallout
        title="Let AI sort tickets before your team sees them"
        description="Tickets are auto-tagged by category and urgency, and a suggested reply is drafted before an agent opens it."
        responseText={'"Thanks for reaching out — I can see your refund was processed on the 2nd and should reflect within 3 business days."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "We stopped losing tickets between inboxes the day we switched.", name: "Diana O." },
          { quote: "The automation rules alone paid for the subscription.", name: "Kevin M.", inverted: true },
          { quote: "Internal notes changed how our team hands off tickets.", name: "Faith N." },
        ]}
      />
      <FaqBlock
        items={[
          {
            question: "Can tickets come from more than email?",
            answer: "Yes, email, chat, and social channels all land in the same queue.",
          },
          {
            question: "Can I set custom automation rules?",
            answer: "Yes, build rules based on tags, keywords, priority, or time elapsed.",
          },
        ]}
      />
      <SimpleCta title="Never lose a ticket again" />
    </article>
  );
}
