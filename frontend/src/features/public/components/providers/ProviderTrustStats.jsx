import { BriefcaseBusiness, CheckCircle2, Clock3, MessageSquare, Star } from 'lucide-react';
import {
  getProviderAvailabilityLabel,
  getProviderCompletedJobs,
  getProviderExperienceYears,
  getProviderRatingValue,
  getProviderReviewsCount,
} from './providerProfileUtils';

function StatCard({ icon: Icon = null, label, value }) {
  if (!Icon) return null;
  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[var(--sf-text-main)]">{value}</p>
    </article>
  );
}

export function ProviderTrustStats({ provider }) {
  const rating = getProviderRatingValue(provider);
  const reviews = getProviderReviewsCount(provider);
  const completedJobs = getProviderCompletedJobs(provider);
  const experienceYears = getProviderExperienceYears(provider);
  const availability = getProviderAvailabilityLabel(provider);

  const items = [
    rating != null ? { key: 'rating', label: 'Rating', value: rating.toFixed(1), icon: Star } : null,
    reviews != null ? { key: 'reviews', label: 'Reviews', value: String(reviews), icon: MessageSquare } : null,
    completedJobs != null ? { key: 'jobs', label: 'Completed Jobs', value: String(completedJobs), icon: CheckCircle2 } : null,
    experienceYears != null ? { key: 'experience', label: 'Experience', value: `${experienceYears} yrs`, icon: BriefcaseBusiness } : null,
    availability ? { key: 'availability', label: 'Availability', value: availability, icon: Clock3 } : null,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {items.map((item) => (
        <StatCard key={item.key} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </section>
  );
}

export default ProviderTrustStats;

