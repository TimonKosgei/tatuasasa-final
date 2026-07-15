const smallTiles = [
  {
    title: "Tatua Sasa AI",
    body: "Answers before a human has to type one.",
    inverted: false,
  },
  {
    title: "24/7 coverage",
    body: "Your AI support companion never clocks out.",
    inverted: true,
  },
  {
    title: "Knowledge base",
    body: "Guides that solve issues before a ticket exists.",
    inverted: false,
  },
  {
    title: "Workforce management",
    body: "Balance workloads, automatically.",
    inverted: false,
  },
];

const Tile = ({ children, inverted = false, className = "" }) => (
  <div
    className={`group p-5 transition-colors duration-150 ${
      inverted
        ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
        : "bg-[var(--color-bg)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
    } ${className}`}
  >
    {children}
  </div>
);

export default function BentoGrid() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-14">
      <div className="grid grid-cols-1 gap-px border border-[var(--color-ink)] bg-[var(--color-ink)] md:grid-cols-3">
        <Tile className="md:row-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)] group-hover:text-[var(--color-invert-muted)]">
            Product
          </p>
          <h3 className="mt-2 text-[20px] font-semibold tracking-tight">
            Ticketing that never loses a request
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)] group-hover:text-[var(--color-invert-muted)]">
            Every channel, one queue. Prioritise, assign, and resolve without
            anything slipping through.
          </p>
          <div className="mt-5 flex h-[90px] items-center justify-center border border-dashed border-[var(--color-line)] text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] group-hover:border-[var(--color-invert-line)] group-hover:text-[var(--color-invert-muted)]">
            Dashboard preview
          </div>
        </Tile>

        {smallTiles.map((tile) => (
          <Tile key={tile.title} inverted={tile.inverted}>
            <p className="text-[13px] font-semibold">{tile.title}</p>
            <p
              className={`mt-1.5 text-[12px] leading-relaxed ${
                tile.inverted
                  ? "text-[var(--color-invert-muted)]"
                  : "text-[var(--color-muted)] group-hover:text-[var(--color-invert-muted)]"
              }`}
            >
              {tile.body}
            </p>
          </Tile>
        ))}
      </div>
    </section>
  );
}
