export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-line)] py-8">
      <div className="mx-auto max-w-[1280px] px-6 text-center text-[13px] text-[var(--color-muted)]">
        © {year} Tatua Sasa. All rights reserved.
      </div>
    </footer>
  );
}
