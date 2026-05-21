import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { AUTH_ROLE } from '../constants/auth.constant';

const tabs = [
  { role: AUTH_ROLE.CUSTOMER, label: 'Customer', icon: UserRound },
  { role: AUTH_ROLE.PROVIDER, label: 'Provider', icon: BriefcaseBusiness },
];

export function RegisterRoleTabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--sf-surface-soft)] p-2" role="tablist" aria-label="Account type">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.role;

        return (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.role)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              active
                ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)] text-white shadow-sm'
                : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)] hover:border-[var(--sf-secondary)] hover:text-[var(--sf-secondary)]'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default RegisterRoleTabs;
