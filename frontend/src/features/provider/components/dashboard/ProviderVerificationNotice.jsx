import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';

const copyByStatus = {
  PENDING_APPROVAL: {
    title: 'Your provider profile is under review.',
    description: 'You will receive job requests after SewaFi approves your provider profile.',
  },
  REJECTED: {
    title: 'Your provider profile needs attention.',
    description: 'Please review your profile details and complete any requested updates.',
  },
  SUSPENDED: {
    title: 'Your provider account is currently suspended.',
    description: 'Nearby job requests are paused until this status changes.',
  },
};

export function ProviderVerificationNotice({ status }) {
  if (!status || status === 'APPROVED') return null;

  const copy = copyByStatus[status] || {
    title: 'Provider profile is not approved yet.',
    description: 'Nearby jobs will appear after your provider profile is approved.',
  };

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-accent-soft)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-surface)] text-[var(--sf-accent)]">
            {status === 'APPROVED' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-extrabold text-[var(--sf-text-main)]">{copy.title}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{copy.description}</p>
          </div>
        </div>
        <Button as={Link} to="/provider/profile" variant="outline" className="rounded-xl">
          View Profile / Complete Profile
        </Button>
      </div>
    </section>
  );
}

export default ProviderVerificationNotice;
