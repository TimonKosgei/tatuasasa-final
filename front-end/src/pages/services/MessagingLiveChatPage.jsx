import PageBreadcrumb from "../../components/shared/PageBreadcrumb";
import PageHero from "../../components/shared/PageHero";
import FeatureRow from "../../components/shared/FeatureRow";
import StatBand from "../../components/shared/StatBand";
import AiCallout from "../../components/shared/AiCallout";
import TestimonialGrid from "../../components/shared/TestimonialGrid";
import FaqBlock from "../../components/shared/FaqBlock";
import SimpleCta from "../../components/shared/SimpleCta";

const chatMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Live chat</p>
    <div className="flex flex-col gap-1.5">
      <div className="max-w-[80%] self-start bg-[#f1efe8] px-2.5 py-2 text-[11px]">
        My printer on floor 3 is jammed again
      </div>
      <div className="max-w-[80%] self-end bg-[var(--color-ink)] px-2.5 py-2 text-[11px] text-[var(--color-bg)]">
        On it — sending a technician now
      </div>
      <div className="max-w-[80%] self-start bg-[#f1efe8] px-2.5 py-2 text-[11px]">Thank you!</div>
    </div>
  </>
);

const savedReplyMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Saved reply</p>
    <div className="bg-[#f7f7f7] p-2 text-[11px] leading-relaxed">
      "Thanks for flagging this — I've assigned a technician and you'll get an update within 30
      minutes."
    </div>
  </>
);

const fileMockup = (
  <div className="flex items-center gap-2">
    <div className="flex h-11 w-11 items-center justify-center border border-[var(--color-line)] text-[9px] text-[var(--color-muted)]">
      IMG
    </div>
    <p className="text-[11px] text-[var(--color-muted)]">printer_error.jpg — 2.1 MB</p>
  </div>
);

const availabilityMockup = (
  <>
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Availability</p>
    <div className="flex flex-col gap-1.5 text-[11px]">
      <div className="flex justify-between">
        <span>Amina R.</span>
        <span>● Online</span>
      </div>
      <div className="flex justify-between text-[var(--color-muted)]">
        <span>Brian K.</span>
        <span>● Away</span>
      </div>
      <div className="flex justify-between">
        <span>Sarah M.</span>
        <span>● Online</span>
      </div>
    </div>
  </>
);

export default function MessagingLiveChatPage() {
  return (
    <article>
      <PageBreadcrumb text="Services / Messaging and live chats" />
      <PageHero
        eyebrow="Services"
        title="Engage with technicians for fast solutions"
        description="Real-time messaging between staff, technicians, and supervisors, so nobody waits for the next ticket update to get an answer."
        mockup={chatMockup}
      />
      <FeatureRow
        eyebrow="Canned responses"
        title="Answer common questions in one click"
        description="Save your most-used replies once, then drop them into any conversation without retyping."
        mockup={savedReplyMockup}
      />
      <FeatureRow
        reverse
        eyebrow="File sharing"
        title="Share a screenshot, not a paragraph"
        description="Drop in photos, screen recordings, or documents right in the chat thread so context never gets lost."
        mockup={fileMockup}
      />
      <FeatureRow
        eyebrow="Smart routing"
        title="Chats go to whoever's actually free"
        description="New conversations route to available technicians automatically, based on skill and current load."
        mockup={availabilityMockup}
      />
      <StatBand
        stats={[
          { value: "12s", label: "Average chat response" },
          { value: "96%", label: "Chat satisfaction" },
          { value: "4,900", label: "Chats handled / month" },
          { value: "40+", label: "Saved replies in use" },
        ]}
      />
      <AiCallout
        title="AI drafts the reply while you're still reading the message"
        description="A suggested response appears the moment a chat comes in, pulled from your knowledge base and past conversations."
        responseText={'"That printer model is prone to jams on tray 2 — I\'m sending someone with a replacement roller."'}
      />
      <TestimonialGrid
        testimonials={[
          { quote: "Chat replaced half our email back-and-forth overnight.", name: "Naomi K." },
          { quote: "Saved replies alone cut our response time in half.", name: "Victor O.", inverted: true },
          { quote: "Routing means the right technician sees it immediately.", name: "Ruth A." },
        ]}
      />
      <FaqBlock
        items={[
          { question: "Can chats turn into tickets automatically?", answer: "Yes, any chat can be escalated into a tracked ticket in one click." },
          { question: "Is there a mobile app for chat?", answer: "Yes, technicians can reply to chats from their phone." },
          { question: "Can I set working hours for chat?", answer: "Yes, chat can show as offline outside your set hours, with a fallback to tickets." },
        ]}
      />
      <SimpleCta title="Get answers to your team without the wait" />
    </article>
  );
}
