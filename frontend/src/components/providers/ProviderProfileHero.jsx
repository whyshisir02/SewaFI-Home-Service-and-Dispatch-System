import { CheckCircle2, Star, BriefcaseBusiness } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { StarRatingDisplay } from '../../features/review/components/StarRatingDisplay';
import {
  getProviderAvatar,
  getProviderCategoryName,
  getProviderCompletedJobs,
  getProviderExperienceYears,
  getProviderName,
  getProviderRatingValue,
  getProviderStatus,
  providerStatusText,
} from './providerProfileUtils';

const getInitials = (name = 'Provider') =>
  String(name)
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function ProviderProfileHero({ provider }) {
  const name = getProviderName(provider);
  const avatar = getProviderAvatar(provider);
  const categoryName = getProviderCategoryName(provider);
  const rating = getProviderRatingValue(provider);
  const completedJobs = getProviderCompletedJobs(provider);
  const experienceYears = getProviderExperienceYears(provider);
  const status = getProviderStatus(provider);

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {avatar ? (
          <img src={avatar} alt={`${name} avatar`} className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--sf-surface-soft)] text-2xl font-bold text-[var(--sf-text-main)]">
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--sf-text-main)] sm:text-3xl">{name}</h1>
            {status ? <StatusBadge status={status} /> : null}
          </div>

          {categoryName ? <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{categoryName}</p> : null}
          {status ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--sf-text-muted)]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {providerStatusText(status)}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {rating != null ? (
              <div className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <StarRatingDisplay rating={rating} showText />
              </div>
            ) : null}
            {completedJobs != null ? (
              <span className="inline-flex items-center gap-1 text-sm text-[var(--sf-text-muted)]">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                {completedJobs} completed jobs
              </span>
            ) : null}
            {experienceYears != null ? (
              <span className="text-sm text-[var(--sf-text-muted)]">{experienceYears} years experience</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProviderProfileHero;

