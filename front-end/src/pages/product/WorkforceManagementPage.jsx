import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const scheduleMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">This week's schedule</p>
    <div className="grid grid-cols-5 gap-1">
      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
        <div key={d} className="text-center text-[9px] text-[var(--color-muted)]">
          {d}
        </div>
      ))}
      {[30, 44, 38, 50, 26].map((h, i) => (
        <div
          key={i}
          className={i === 2 || i === 4 ? "bg-[#b4b2a9]" : "bg-[var(--color-ink)]"}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  </>
);

const balanceMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Workload balance</p>
    <div className="flex flex-col gap-1.5">
      {[
        { name: "Amina R.", pct: 62 },
        { name: "Brian K.", pct: 91 },
      ].map((a) => (
        <div key={a.name} className="flex items-center gap-2">
          <span className="w-[70px] text-[11px]">{a.name}</span>
          <div className="h-2 flex-1 bg-[#f1efe8]">
            <div className="h-full bg-[var(--color-ink)]" style={{ width: `${a.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  </>
);

const perfMockup = (
  <svg viewBox="0 0 260 70" width="100%" height="70">
    <rect x="0" y="30" width="30" height="40" fill="var(--color-ink)" />
    <rect x="40" y="15" width="30" height="55" fill="var(--color-ink)" />
    <rect x="80" y="40" width="30" height="30" fill="#b4b2a9" />
    <rect x="120" y="5" width="30" height="65" fill="var(--color-ink)" />
    <rect x="160" y="25" width="30" height="45" fill="#b4b2a9" />
    <rect x="200" y="10" width="30" height="60" fill="var(--color-ink)" />
  </svg>
);

export default function WorkforceManagementPage() {
  return (
    <article>
      <PageBreadcrumb text="Product / Workforce management" />
      <PageHero
        eyebrow="Product"
        title="Schedule smarter, staff better"
        description="Balance shifts and workloads so the right number of people are available exactly when ticket volume needs them."
        mockup={scheduleMockup}
      />
      <FeatureRow
        eyebrow="Workload balancing"
        title="Spot overload before it becomes burnout"
        description="See exactly who's carrying too much, and reassign tickets in one click before service quality slips."
        mockup={balanceMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Performance tracking"
        title="Coach with data, not guesswork"
        description="Track resolution speed, quality scores, and attendance in one view, so 1:1s are backed by real numbers."
        mockup={perfMockup}
      />
      <StatBand
        stats={[
          { value: "28%", label: "Reduced overtime" },
          { value: "100%", label: "Shift coverage" },
          { value: "15", label: "Hrs saved on scheduling / month" },
          { value: "4.6", label: "Avg team performance score" },
        ]}
      />
      <AiCallout
        title="AI forecasts staffing needs before you need them"
        description="Based on past ticket volume, Tatua Sasa AI recommends how many agents to schedule for each shift."
        responseText={'"Expect a 20% volume spike Monday morning. Recommend scheduling 2 extra agents."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "Scheduling used to take me half a day. Now it's minutes.", name: "Esther M." },
          { quote: "We finally caught burnout before someone quit.", name: "Tom H.", inverted: true },
          { quote: "The staffing forecast has been right two months running.", name: "Purity W." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Can I set shift preferences per agent?", answer: "Yes, agents can set availability and preferred shift types." },
          { question: "Does it integrate with payroll?", answer: "Export approved hours directly for payroll processing." },
        ]}
      />
      <SimpleCta title="Manage your workforce to yield better results" />
    </article>
  );
}
