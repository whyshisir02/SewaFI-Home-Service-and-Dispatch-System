import { formatDate } from '../../utils/formatDate';
import {
  getProviderBio,
  getProviderCategoryName,
  getProviderExperienceYears,
  getProviderJoinedAt,
} from './providerProfileUtils';

export function ProviderAboutSection({ provider }) {
  const bio = getProviderBio(provider);
  const experienceYears = getProviderExperienceYears(provider);
  const categoryName = getProviderCategoryName(provider);
  const joinedAt = getProviderJoinedAt(provider);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">About & Experience</h2>

      {bio ? (
        <p className="mt-3 text-sm leading-7 text-[var(--sf-text-main)]">{bio}</p>
      ) : (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No provider bio has been added yet.</p>
      )}

      <div className="mt-4 grid gap-2 text-sm text-[var(--sf-text-muted)] sm:grid-cols-2">
        {experienceYears != null ? <p>Experience: <span className="text-[var(--sf-text-main)]">{experienceYears} years</span></p> : null}
        {categoryName ? <p>Category: <span className="text-[var(--sf-text-main)]">{categoryName}</span></p> : null}
        {joinedAt ? <p>Joined: <span className="text-[var(--sf-text-main)]">{formatDate(joinedAt)}</span></p> : null}
      </div>
    </section>
  );
}

export default ProviderAboutSection;
