import { Phone, ShieldCheck, Star, UserRound } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';

const initials = (name = 'Provider') =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function ProviderDetailsCard({ booking }) {
  const provider = booking.provider;
  const profile = provider?.providerProfile || booking.providerProfile;
  const statusAllowsContact = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);

  if (!provider && !booking.providerId) {
    return (
      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
        <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Provider Details</h2>
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-bg)] p-5 text-center">
          <UserRound className="mx-auto h-10 w-10 text-[var(--sf-secondary)]" aria-hidden="true" />
          <h3 className="mt-3 font-bold text-[var(--sf-text-main)]">Provider not assigned yet</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
            SewaFi is notifying eligible providers. Details will appear here after a provider accepts your booking.
          </p>
        </div>
      </section>
    );
  }

  const name = provider?.name || provider?.fullName || 'Assigned provider';
  const avatar = provider?.avatar || provider?.avatarUrl;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Provider Details</h2>
      <div className="mt-5 flex gap-4">
        {avatar ? (
          <img src={avatar} alt={`${name} avatar`} loading="lazy" decoding="async" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-xl font-extrabold text-[var(--sf-secondary)]">
            {initials(name)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-[var(--sf-text-main)]">{name}</h3>
          {booking.service?.category?.name ? <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{booking.service.category.name}</p> : null}
          {profile?.isVerified ? (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--sf-secondary-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {profile?.averageRating ? <Metric icon={Star} label="Rating" value={profile.averageRating} /> : null}
        {profile?.totalJobs ? <Metric icon={ShieldCheck} label="Total Jobs" value={profile.totalJobs} /> : null}
      </div>

      {provider?.phone && statusAllowsContact ? (
        <Button as="a" href={`tel:${provider.phone}`} className="mt-5 w-full rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95">
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call Provider
        </Button>
      ) : null}
    </section>
  );
}

function Metric({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
      <IconComponent className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--sf-text-soft)]">{label}</p>
      <p className="font-bold text-[var(--sf-text-main)]">{value}</p>
    </div>
  );
}

export default ProviderDetailsCard;
