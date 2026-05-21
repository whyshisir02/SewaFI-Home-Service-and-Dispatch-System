import { MapPin, Navigation, Route, ShieldCheck } from 'lucide-react';
import { Container } from '../ui/Layout/Container';

export function ServiceHero() {
  return (
    <section className="bg-[var(--sf-bg)] pt-10 sm:pt-14 lg:pt-16">
      <Container>
        <div className="grid items-center gap-8 overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-primary-soft)_55%,var(--sf-secondary-soft)_100%)] p-6 shadow-[var(--sf-shadow)] sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-secondary)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Verified services, dispatch-ready booking
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-[34px] font-extrabold leading-[44px] tracking-tight text-[var(--sf-text-main)] sm:text-5xl sm:leading-[58px] lg:text-[54px] lg:leading-[62px]">
              Find the Right Service for Your Home
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg sm:leading-8">
              Browse trusted home services, compare options, and book with location-based dispatch.
            </p>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-[var(--sf-border)] bg-[var(--sf-surface)]/80 p-6 sm:min-h-[320px]">
            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--sf-secondary)_1px,transparent_1px)] [background-size:24px_24px]" />
            <svg className="absolute inset-0 h-full w-full text-[var(--sf-secondary)] opacity-40" viewBox="0 0 520 320" fill="none" aria-hidden="true">
              <path d="M68 220 C 145 102, 214 248, 316 132 S 438 118, 454 232" stroke="currentColor" strokeWidth="4" strokeDasharray="9 12" strokeLinecap="round" />
              <path d="M52 266H164L206 218L248 250L308 174L356 210L396 154L468 266H52Z" fill="currentColor" opacity="0.15" />
            </svg>
            <div className="absolute left-8 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-secondary)] text-white shadow-[var(--sf-shadow)]">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="absolute right-10 top-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-primary)] text-white shadow-[var(--sf-shadow)]">
              <Navigation className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="absolute bottom-8 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-[var(--sf-accent)] text-white shadow-[var(--sf-shadow)]">
              <Route className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="font-bold text-[var(--sf-text-main)]">Search, compare, book</p>
              <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">Service requests move into SewaFi dispatch after booking.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ServiceHero;
