import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import BentoGrid from "../components/BentoGrid";
import RolesSection from "../components/RolesSection";
import TaglineBand from "../components/TaglineBand";
import StatSweep from "../components/StatSweep";
import TestimonialRow from "../components/TestimonialRow";
import FaqAccordion from "../components/FaqAccordion";
import ClosingCta from "../components/ClosingCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <BentoGrid />
      <RolesSection />
      <TaglineBand />
      <StatSweep />
      <TestimonialRow />
      <FaqAccordion />
      <ClosingCta />
    </>
  );
}
