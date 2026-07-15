import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const incidentMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Incident queue</p>
    <div className="flex flex-col gap-1.5 text-[11px]">
      <div className="flex justify-between border border-[var(--color-line)] bg-[var(--color-ink)] p-2 text-[var(--color-bg)]">
        <span>INC-204 Server down</span>
        <span>P1</span>
      </div>
      <div className="flex justify-between border border-[var(--color-line)] p-2">
        <span>INC-205 VPN issue</span>
        <span className="text-[var(--color-muted)]">P2</span>
      </div>
      <div className="flex justify-between border border-[var(--color-line)] p-2">
        <span>INC-206 Slow laptop</span>
        <span className="text-[var(--color-muted)]">P3</span>
      </div>
    </div>
  </>
);

const changeMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Change request</p>
    <p className="text-[11px] leading-loose">
      <b>Change</b> Upgrade firewall firmware
      <br />
      <b>Approved by</b> IT Manager
      <br />
      <b>Scheduled</b> Sunday 2 AM
    </p>
  </>
);

const assetMockup = (
  <p className="text-[11px] leading-loose">
    <b>Asset</b> Laptop DL-2291
    <br />
    <b>Assigned to</b> R. Owino
    <br />
    <b>Last serviced</b> 2 months ago
  </p>
);

const escalationMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Escalation path</p>
    <p className="text-[11px] leading-loose text-[var(--color-muted)]">
      L1 support (0–15 min)
      <br />↓<br />
      L2 engineer (15–60 min)
      <br />↓<br />
      On-call lead (60 min+)
    </p>
  </>
);

export default function ItServiceManagementPage() {
  return (
    <article>
      <PageBreadcrumb text="Services / IT service management" />
      <PageHero
        eyebrow="Services"
        title="Empower your workforce"
        description="Standardise how IT issues are logged, escalated, and resolved, giving every team member the tools to fix problems faster."
        mockup={incidentMockup}
      />
      <FeatureRow
        eyebrow="Change management"
        title="Roll out changes without breaking things"
        description="Route every infrastructure change through approval, scheduling, and rollback plans before it goes live."
        mockup={changeMockup}
      />
      <FeatureRow
        reverse
        eyebrow="Asset tracking"
        title="Know what hardware exists, and who has it"
        description="Link every ticket to the device involved, and keep a full history of repairs and replacements per asset."
        mockup={assetMockup}
      />
      <FeatureRow
        eyebrow="SLAs and escalation"
        title="Critical issues never sit in a queue"
        description="Set escalation tiers by severity so a server outage reaches the right engineer in minutes, not hours."
        mockup={escalationMockup}
      />
      <StatBand
        stats={[
          { value: "99.9%", label: "Uptime tracked" },
          { value: "8 min", label: "Avg P1 response" },
          { value: "640", label: "Assets tracked" },
          { value: "0", label: "Unapproved changes deployed" },
        ]}
      />
      <AiCallout
        title="AI points to the likely root cause first"
        description="When an incident is logged, Tatua Sasa AI scans similar past incidents and suggests where to look first."
        responseText={'"3 similar VPN incidents this month were traced to a certificate renewal issue."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "Change approvals stopped being a Slack thread nobody could find.", name: "James N." },
          { quote: "Asset history saved us during our last audit.", name: "Priya S.", inverted: true },
          { quote: "P1 incidents now reach the right engineer in minutes.", name: "Michael T." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Does this replace a separate ITSM tool?", answer: "Yes, incidents, changes, and assets all live in Tatua Sasa alongside support tickets." },
          { question: "Can I set custom severity levels?", answer: "Yes, define your own P1 to P4 tiers with matching escalation rules." },
        ]}
      />
      <SimpleCta title="Give your IT team a real system to work from" />
    </article>
  );
}
