import { useState } from "react";

export default function FaqBlock({ heading = "Common questions", items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="mx-auto max-w-[640px] px-6 pb-14">
      <h2 className="mb-4 text-center text-[18px] font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="border-t border-[var(--color-line)]">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.question} className="border-b border-[var(--color-line)]">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between py-3 text-left text-[13px] font-semibold"
                aria-expanded={isOpen}
              >
                {item.question}
                <span className="ml-4 text-[15px]">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="pb-3 text-[12px] leading-relaxed text-[var(--color-muted)]">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
