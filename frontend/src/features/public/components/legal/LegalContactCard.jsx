import { Mail, MapPin, Phone } from 'lucide-react';

export function LegalContactCard({ settings = {} }) {
  const supportEmail = settings.supportEmail || settings.email || '';
  const supportPhone = settings.supportPhone || settings.phone || '';
  const address = settings.address || '';
  const hasContact = Boolean(supportEmail || supportPhone || address);

  if (!hasContact) return null;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)] sm:text-xl">Contact</h2>
      <p className="mt-2 text-sm text-[var(--sf-text-muted)]">For policy-related questions, please use the support channels below.</p>
      <div className="mt-4 space-y-3 text-sm text-[var(--sf-text-muted)]">
        {supportEmail ? (
          <a href={`mailto:${supportEmail}`} className="flex items-start gap-2 transition hover:text-[var(--sf-primary)]">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{supportEmail}</span>
          </a>
        ) : null}
        {supportPhone ? (
          <a href={`tel:${supportPhone}`} className="flex items-start gap-2 transition hover:text-[var(--sf-primary)]">
            <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{supportPhone}</span>
          </a>
        ) : null}
        {address ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{address}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default LegalContactCard;

