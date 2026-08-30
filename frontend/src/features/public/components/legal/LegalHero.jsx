import { ShieldCheck } from 'lucide-react';
import { Container } from '../../../../components/ui/Layout/Container';

export function LegalHero({ title, subtitle, lastUpdated }) {
  return (
    <section className="py-10 sm:py-12">
      <Container>
        <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-primary)]/10 via-[var(--sf-secondary)]/10 to-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)] sm:p-8 lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-primary)]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Legal
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)] sm:text-lg">{subtitle}</p>
          {lastUpdated ? <p className="mt-4 text-sm text-[var(--sf-text-muted)]">Last updated: {lastUpdated}</p> : null}
        </div>
      </Container>
    </section>
  );
}

export default LegalHero;

