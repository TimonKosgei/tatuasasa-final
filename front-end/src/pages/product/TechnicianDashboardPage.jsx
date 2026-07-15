import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const queueMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Today's queue</p>
    <div className="flex flex-col gap-1.5">
      {[
        { label: "Fix printer, Floor 3", tag: "High", active: true },
        { label: "Reset password, R. Owino", tag: "Medium", active: false },
        { label: "Install software update", tag: "Low", active: false },
      ].map((row) => (
        <div
          key={row.label}
          className={`flex justify-between border border-[var(--color-line)] p-2 text-[11px] ${
            row.active ? "bg-[var(--color-ink)] text-[var(--color-bg)]" : ""
          }`}
        >
          <span>{row.label}</span>
          <span className={row.active ? "" : "text-[var(--color-muted)]"}>{row.tag}</span>
        </div>
      ))}
    </div>
  </>
);

const historyMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Ticket history</p>
    <p className="text-[11px] leading-loose text-[var(--color-muted)]">
      Jul 1 — Opened by R. Owino
      <br />
      Jul 2 — Escalated to L2
      <br />
      Jul 3 — Assigned to you
    </p>
  </>
);

const mobileMockup = (
  <div className="flex justify-center">
    <div className="h-[170px] w-[110px] rounded-[10px] border-2 border-[var(--color-ink)] p-2">
      <div className="mx-auto mb-2 h-1.5 w-8 rounded bg-[var(--color-line)]" />
      <p className="text-center text-[9px] text-[var(--color-muted)]">
        Job #204
        <br />
        Status: In progress
      </p>
    </div>
  </div>
);

export default function TechnicianDashboardPage() {
  return (
    <article>
      <PageBreadcrumb text="Product / Technician Dashboard" />
      <PageHero
        eyebrow="Product"
        title="One dashboard, zero guesswork for your technicians"
        description="Every assigned job, sorted by priority, with full history attached, so technicians always know exactly what's next."
        mockup={queueMockup}
      />
      <FeatureRow
        eyebrow="Full context, one click away"
        title="Never ask 'what happened before this?' again"
        description="Pull up every past interaction on a ticket without switching tools or hunting through email threads."
        mockup={historyMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Works anywhere"
        title="Built for the field, not just the desk"
        description="Update ticket status, log parts used, and close jobs from a phone, without losing formatting or attachments."
        mockup={mobileMockup}
      />
      <StatBand
        stats={[
          { value: "35%", label: "Faster job completion" },
          { value: "6", label: "Avg jobs / technician / day" },
          { value: "0", label: "Tools switched between" },
          { value: "92%", label: "On-time job completion" },
        ]}
      />
      <AiCallout
        title="AI suggests the fix before the technician arrives"
        description="Based on similar past jobs, Tatua Sasa AI recommends likely causes and required parts."
        responseText={'"Similar tickets were fixed by replacing the fuser unit. Bring a spare."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "My technicians stopped calling me asking what to do next.", name: "Peter W." },
          { quote: "The mobile view is genuinely usable in the field, not an afterthought.", name: "Grace A.", inverted: true },
          { quote: "Job completion times dropped within the first two weeks.", name: "Samuel K." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Does it work offline in the field?", answer: "Job data syncs the moment connection is restored." },
          { question: "Can technicians see their full job history?", answer: "Yes, every past ticket a technician has touched is searchable." },
        ]}
      />
      <SimpleCta title="Give your technicians a flawless work structure" />
    </article>
  );
}
