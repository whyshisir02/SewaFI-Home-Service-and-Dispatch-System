import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '../../../../components/ui/Layout/Card';

const checklistFromProfile = ({ user, providerProfile }) => {
  const accountUser = user || providerProfile?.user || null;
  const serviceAreas =
    providerProfile?.serviceAreas ||
    providerProfile?.workingAreas ||
    providerProfile?.areas ||
    [];
  const hasLocation = Boolean(
    accountUser?.province && accountUser?.district && accountUser?.municipality
  );
  const hasCategory = Boolean(providerProfile?.categoryId || providerProfile?.category?.id);
  const isAccountVerified = Boolean(
    accountUser?.isVerified ||
      accountUser?.isEmailVerified ||
      accountUser?.emailVerified ||
      (providerProfile?.status && accountUser?.isActive !== false)
  );
  const hasExperience = Boolean(
    (providerProfile?.experienceYears != null && Number(providerProfile.experienceYears) > 0) ||
      providerProfile?.experience ||
      providerProfile?.experienceText
  );
  const status = String(providerProfile?.status || '').toUpperCase();
  const statusLabel = status === 'APPROVED' ? 'Application approved' : 'Application submitted';

  const items = [
    { key: 'accountVerified', label: 'Account verified', done: isAccountVerified },
    { key: 'serviceCategory', label: 'Service category selected', done: hasCategory },
    { key: 'experience', label: 'Experience added', done: hasExperience },
    { key: 'bio', label: 'Bio added', done: Boolean(providerProfile?.bio) },
    { key: 'workingArea', label: 'Working area added', done: hasLocation || serviceAreas.length > 0 },
    { key: 'applicationSubmitted', label: statusLabel, done: Boolean(providerProfile?.status) },
  ];

  const completed = items.filter((item) => item.done).length;
  const percent = Math.round((completed / items.length) * 100);

  return { items, completed, total: items.length, percent };
};

export function ProfileCompletionChecklist({ user, providerProfile }) {
  const checklist = checklistFromProfile({ user, providerProfile });

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Profile Completion Checklist</h3>
        <span className="text-sm font-semibold text-[var(--sf-text-main)]">{checklist.percent}%</span>
      </div>
      <p className="mt-1 text-xs text-[var(--sf-text-muted)]">Based on available profile fields</p>
      <ul className="mt-4 space-y-3">
        {checklist.items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 text-sm text-[var(--sf-text-main)]">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 text-[var(--sf-text-muted)]" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default ProfileCompletionChecklist;
