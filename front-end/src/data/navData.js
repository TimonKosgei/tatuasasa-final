// Central content map for the nav mega-menus.
// Each item generates both a dropdown entry AND a real routed page,
// so every link in the nav actually goes somewhere.

export const navData = [
  {
    key: "sphere",
    label: "Sphere",
    blurb: "The intelligence layer behind every ticket.",
    items: [
      {
        slug: "reports-and-analytics",
        title: "Reports and analytics",
        tagline: "Turn insights into better outcomes.",
        body:
          "See exactly where support is working and where it isn't. Tatua Sasa turns raw ticket data into dashboards your team can act on — response times, resolution rates, agent load, and customer sentiment, all in one view.",
      },
      {
        slug: "tatua-sasa-ai",
        title: "Tatua Sasa AI",
        tagline: "Use artificial intelligence for intelligent answers.",
        body:
          "Let AI read the ticket before your team does. Tatua Sasa AI drafts replies, suggests fixes from your knowledge base, and flags urgent issues automatically — so your agents spend time solving, not sorting.",
      },
    ],
  },
  {
    key: "product",
    label: "Product",
    blurb: "Everything your support desk runs on.",
    items: [
      {
        slug: "ticketing",
        title: "Ticketing",
        tagline: "Every request, organised and on time.",
        body:
          "Tickets flow in from every channel and land in one queue. Prioritise, assign, and track each one from first contact to resolution, without anything slipping through.",
      },
      {
        slug: "contact-centre",
        title: "Contact centre",
        tagline: "Have fast responses using Tatua Sasa.",
        body:
          "Answer calls, chats, and emails from a single workspace. Built-in routing gets every conversation to the right person the first time.",
      },
      {
        slug: "technician-dashboard",
        title: "Technician Dashboard",
        tagline: "Give the technician a flawless work structure.",
        body:
          "A clear, single-screen view of assigned jobs, priorities, and history — so technicians always know what's next and never lose context switching between tools.",
      },
      {
        slug: "workforce-management",
        title: "Workforce management",
        tagline: "Manage your workforce to yield better results.",
        body:
          "Schedule shifts, balance workloads, and track performance in one place, so the right person is available at the right time, every time.",
      },
    ],
  },
  {
    key: "services",
    label: "Services",
    blurb: "How teams use Tatua Sasa day to day.",
    items: [
      {
        slug: "messaging-and-live-chats",
        title: "Messaging and live chats",
        tagline: "Engage with the technicians for fast solutions.",
        body:
          "Real-time messaging between staff, technicians, and supervisors keeps everyone aligned without waiting for the next ticket update.",
      },
      {
        slug: "ticketing-solutions",
        title: "Ticketing",
        tagline: "Track and organise tickets. Apply tickets.",
        body:
          "A structured way to log, categorise, and apply tickets across teams — nothing gets duplicated, and nothing gets lost.",
      },
      {
        slug: "it-service-management",
        title: "IT service management",
        tagline: "Empower your workforce.",
        body:
          "Standardise how IT issues are logged, escalated, and resolved, giving every team member the tools to fix problems faster.",
      },
      {
        slug: "knowledge-base",
        title: "Knowledge base",
        tagline: "Search articles and guides to solve issues quickly.",
        body:
          "A searchable library of guides and fixes, so common issues get resolved before they ever need a technician.",
      },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    blurb: "Resources beyond the platform.",
    items: [
      {
        slug: "customer-reviews",
        title: "Customer reviews",
        tagline: "See what our customers have to say.",
        body:
          "Real feedback from teams using Tatua Sasa every day, across industries and company sizes.",
      },
      {
        slug: "blog",
        title: "Blog",
        tagline: "Explore insights, tips, and updates to help you deliver better support.",
        body:
          "Ideas, playbooks, and product news for people building better support operations.",
      },
      {
        slug: "help-centre",
        title: "Help centre",
        tagline: "Find help fast with our support resources.",
        body:
          "Guides and answers for getting the most out of Tatua Sasa, organised so you find what you need in seconds.",
      },
      {
        slug: "partners",
        title: "Partners",
        tagline: "Working with trusted partners to deliver reliable support solutions.",
        body:
          "We work alongside a network of partners to extend what Tatua Sasa can do for your organisation.",
      },
      {
        slug: "about-us",
        title: "About us",
        tagline: "Learn who we are and what drives us.",
        body:
          "Tatua Sasa was built by people who've sat in the support seat — we build the tools we always wished we had.",
      },
    ],
  },
];

export const findItem = (sectionKey, slug) => {
  const section = navData.find((s) => s.key === sectionKey);
  if (!section) return null;
  const item = section.items.find((i) => i.slug === slug);
  if (!item) return null;
  return { section, item };
};
