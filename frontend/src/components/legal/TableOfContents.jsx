export function TableOfContents({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--sf-primary)]">Contents</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="inline-flex rounded-md text-[var(--sf-text-muted)] transition hover:text-[var(--sf-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;

