const items = [
  "Ticketing",
  "Live chat",
  "Knowledge base",
  "Workforce management",
  "AI assistant",
  "Analytics",
];

export default function Marquee() {
  const track = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-[var(--color-ink)] bg-[var(--color-invert-bg)] py-2.5">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className="px-4 text-[13px] font-semibold tracking-wide text-[var(--color-invert-ink)]"
          >
            {item} <span className="text-[var(--color-invert-muted)]">•</span>
          </span>
        ))}
      </div>

      <style>{`
        .marquee-track {
          animation: marquee-scroll 22s linear infinite;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
