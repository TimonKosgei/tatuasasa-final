import { useState } from "react";

const roles = [
  {
    key: "staff",
    label: "Staff",
    heading: "Get help without the back-and-forth.",
    points: [
      "Submit a request in seconds, from any device.",
      "Track exactly where your ticket stands, live.",
      "Get notified the moment it's resolved — no chasing.",
    ],
  },
  {
    key: "technician",
    label: "Technician",
    heading: "Work from one queue, not five tabs.",
    points: [
      "See every assigned job, sorted by priority.",
      "Pull up full ticket history in one click.",
      "Resolve, log, and close without leaving the dashboard.",
    ],
  },
  {
    key: "supervisor",
    label: "Supervisor",
    heading: "See the whole team, not just one ticket.",
    points: [
      "Monitor response and resolution times in real time.",
      "Reassign workload the moment someone's overloaded.",
      "Catch bottlenecks before they become backlogs.",
    ],
  },
];

export default function RolesSection() {
  const [active, setActive] = useState("staff");
  const current = roles.find((r) => r.key === active);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-24">
      <h2 className="mx-auto max-w-[640px] text-center text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]">
        Empower your entire organization with AI driven service management
      </h2>

      <div className="mx-auto mt-12 grid max-w-[960px] grid-cols-1 border border-[var(--color-ink)] md:grid-cols-[220px_1px_1fr]">
        <div className="flex flex-row md:flex-col">
          {roles.map((role, idx) => (
            <button
              key={role.key}
              onMouseEnter={() => setActive(role.key)}
              onFocus={() => setActive(role.key)}
              onClick={() => setActive(role.key)}
              className={`flex-1 border-[var(--color-line)] px-6 py-6 text-left text-[16px] font-semibold transition-colors md:flex-none ${
                idx !== roles.length - 1 ? "border-r md:border-b md:border-r-0" : ""
              } ${
                active === role.key
                  ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
                  : "bg-[var(--color-bg)] text-[var(--color-ink)] hover:bg-[var(--color-line)]"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="hidden bg-[var(--color-line)] md:block" />

        <div className="px-8 py-9 md:px-10">
          <h3 className="text-[20px] font-semibold tracking-tight">
            {current.heading}
          </h3>
          <ul className="mt-5 space-y-3">
            {current.points.map((point) => (
              <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-ink)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
