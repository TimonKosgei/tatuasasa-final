import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const conversationsMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Live conversations</p>
    <div className="flex flex-col gap-1.5">
      {[
        { label: "Call — J. Muriuki", tag: "02:14", active: true },
        { label: "Chat — L. Wanjiru", tag: "Typing…", active: false },
        { label: "Email — order #8821", tag: "Waiting", active: false },
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

const routingMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Routing rule</p>
    <p className="text-[11px] leading-loose">
      <b>If</b> caller mentions "billing"
      <br />
      <b>Route to</b> billing team
      <br />
      <b>Skip</b> general queue
    </p>
  </>
);

const waveformMockup = (
  <>
    <svg viewBox="0 0 260 60" width="100%" height="60">
      <polyline
        points="0,30 20,10 40,40 60,15 80,35 100,20 120,45 140,10 160,30 180,20 200,40 220,15 240,30"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
    </svg>
    <p className="mt-1.5 text-[10px] text-[var(--color-muted)]">Call waveform — sentiment: positive</p>
  </>
);

export default function ContactCentrePage() {
  return (
    <article>
      <PageBreadcrumb text="Product / Contact Centre" />
      <PageHero
        eyebrow="Product"
        title="Every conversation, every channel, one workspace"
        description="Calls, chats, and emails answered from a single screen, with routing that gets each one to the right person the first time."
        mockup={conversationsMockup}
      />
      <FeatureRow
        eyebrow="Smart routing"
        title="The right person, not just any available person"
        description="Route by topic, language, or customer tier so conversations land with the agent best equipped to handle them."
        mockup={routingMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Recording and analytics"
        title="Every call reviewed without listening to every call"
        description="Automatic call recording with searchable transcripts, plus sentiment scoring across your whole team."
        mockup={waveformMockup}
      />
      <StatBand
        stats={[
          { value: "18s", label: "Average wait time" },
          { value: "3", label: "Channels unified" },
          { value: "94%", label: "First-call resolution" },
          { value: "100%", label: "Calls recorded" },
        ]}
      />
      <AiCallout
        title="AI writes the call summary for you"
        description="Every call gets an automatic summary and next-step suggestion, ready before the agent even hangs up."
        responseText={'"Customer requested a refund for order #8821. Next step: process within 48 hours."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "Our agents stopped juggling three separate apps.", name: "Wanjiku T." },
          { quote: "Call summaries alone save us an hour a day per agent.", name: "Daniel O.", inverted: true },
          { quote: "Wait times dropped the week we turned on smart routing.", name: "Lucy N." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Does it support phone calls, not just chat?", answer: "Yes, voice, chat, and email are all handled in one workspace." },
          { question: "Are calls recorded automatically?", answer: "Yes, with searchable transcripts and sentiment tagging." },
        ]}
      />
      <SimpleCta title="Have fast responses using Tatua Sasa" />
    </article>
  );
}
