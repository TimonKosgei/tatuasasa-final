import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { navData } from "../data/navData";

const NavDropdown = ({ section, isOpen, onEnter, onLeave }) => {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="relative"
    >
      <button
        className="flex items-center gap-1 py-8 text-[15px] font-medium tracking-tight text-[var(--color-ink)] transition-opacity hover:opacity-60"
        aria-expanded={isOpen}
      >
        {section.label}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-40 w-[560px] -translate-x-1/2 border border-[var(--color-ink)] bg-[var(--color-bg)]">
          <div className="border-b border-[var(--color-line)] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {section.blurb}
            </p>
          </div>
          <div className="grid grid-cols-2">
            {section.items.map((item, idx) => (
              <Link
                key={item.slug}
                to={`/${section.key}/${item.slug}`}
                className={`group border-[var(--color-line)] px-6 py-5 transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] ${
                  idx % 2 === 0 ? "border-r" : ""
                } ${idx < section.items.length - (section.items.length % 2 === 0 ? 2 : 1) ? "border-b" : ""}`}
              >
                <p className="text-[15px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--color-muted)] group-hover:text-[var(--color-invert-muted)]">
                  {item.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const [openKey, setOpenKey] = useState(null);
  const closeTimer = useRef(null);

  const handleEnter = (key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
        <Link to="/" className="text-[19px] font-bold tracking-tight">
          Tatua Sasa
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navData.map((section) => (
            <NavDropdown
              key={section.key}
              section={section}
              isOpen={openKey === section.key}
              onEnter={() => handleEnter(section.key)}
              onLeave={handleLeave}
            />
          ))}
          <Link
            to="/pricing"
            className="py-8 text-[15px] font-medium tracking-tight transition-opacity hover:opacity-60"
          >
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/demo"
            className="text-[14px] font-medium tracking-tight transition-opacity hover:opacity-60"
          >
            View demo
          </Link>
          <Link
            to="/login"
            className="text-[14px] font-medium tracking-tight transition-opacity hover:opacity-60"
          >
            Log in / Sign up
          </Link>
          <Link
            to="/get-started"
            className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
          >
            Try for free
          </Link>
        </div>

        <MobileMenuButton />
      </div>
    </header>
  );
}

const MobileMenuButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span className="h-[1.5px] w-5 bg-[var(--color-ink)]" />
        <span className="h-[1.5px] w-5 bg-[var(--color-ink)]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full w-full border-b border-[var(--color-line)] bg-[var(--color-bg)] px-6 py-4">
          {navData.map((section) => (
            <div key={section.key} className="border-b border-[var(--color-line)] py-3">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {section.label}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.slug}
                  to={`/${section.key}/${item.slug}`}
                  className="block py-1.5 text-[15px]"
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
          <Link to="/pricing" className="block py-3 text-[15px] font-medium">
            Pricing
          </Link>
          <Link
            to="/get-started"
            className="mt-3 block border border-[var(--color-ink)] bg-[var(--color-ink)] px-5 py-2.5 text-center text-[14px] font-semibold text-[var(--color-bg)]"
          >
            Try for free
          </Link>
        </div>
      )}
    </div>
  );
};