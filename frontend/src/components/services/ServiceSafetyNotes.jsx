import { ShieldCheck } from 'lucide-react';

const normalizeNotes = (items) =>
  Array.isArray(items)
    ? items.map((item, index) => (typeof item === 'string' ? { id: item, title: item } : { id: item.id || item.title || index, ...item }))
    : [];

export function ServiceSafetyNotes({ safetyNotes }) {
  const notes = normalizeNotes(safetyNotes);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-secondary-soft)] p-5 shadow-sm sm:p-6">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-surface)] text-[var(--sf-secondary)]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">Safety and Trust Notes</h2>
          {notes.length ? (
            <div className="mt-4 grid gap-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <h3 className="font-bold text-[var(--sf-text-main)]">{note.title || note.name}</h3>
                  {note.description ? <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{note.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">
              For your safety, SewaFi connects customers with reviewed providers and keeps booking updates visible through the platform.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ServiceSafetyNotes;
