import { useState } from "react";

const faqs = [
  {
    question: "How fast can we get started?",
    answer: "Most teams are set up and taking their first ticket the same day.",
  },
  {
    question: "Does it work for small teams?",
    answer:
      "Yes — Tatua Sasa scales from a two-person team to thousands of daily requests.",
  },
  {
    question: "Can I migrate from another platform?",
    answer:
      "Import your existing tickets and knowledge base in a guided setup step.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="mx-auto max-w-[640px] px-6 py-16">
      <h2 className="mb-5 text-center text-[22px] font-semibold tracking-tight">
        Questions, answered
      </h2>

      <div className="border-t border-[var(--color-line)]">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.question} className="border-b border-[var(--color-line)]">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between py-4 text-left text-[14px] font-semibold"
                aria-expanded={isOpen}
              >
                {faq.question}
                <span className="ml-4 text-[16px]">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="pb-4 text-[13px] leading-relaxed text-[var(--color-muted)]">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
