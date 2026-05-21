import { Link } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Layout/Card';
import { PROVIDER_STATUS } from '../../constants/provider-status.constant';
import { ROUTES } from '../../constants/routes.constant';

const statusSteps = {
  [PROVIDER_STATUS.PENDING_APPROVAL]: [
    'Wait for admin review.',
    'Keep your profile information accurate.',
    'You will be able to receive jobs after approval.',
  ],
  [PROVIDER_STATUS.APPROVED]: [
    'Turn on availability.',
    'View nearby jobs.',
    'Manage assigned jobs.',
  ],
  [PROVIDER_STATUS.REJECTED]: [
    'Update profile if editing is supported.',
    'Contact support for guidance.',
  ],
  [PROVIDER_STATUS.SUSPENDED]: [
    'Contact support.',
  ],
  INCOMPLETE: [
    'Complete required fields.',
    'Save profile for admin review.',
  ],
};

const linksByStatus = {
  [PROVIDER_STATUS.APPROVED]: [
    { label: 'Availability', to: ROUTES.provider.availability },
    { label: 'Nearby Jobs', to: ROUTES.provider.nearbyJobs },
    { label: 'Assigned Jobs', to: ROUTES.provider.assignedJobs },
  ],
};

export function ProviderNextSteps({ status }) {
  const resolvedStatus = status || 'INCOMPLETE';
  const steps = statusSteps[resolvedStatus] || statusSteps.INCOMPLETE;
  const links = linksByStatus[resolvedStatus] || [];

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Next Steps</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--sf-text-muted)]">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>

      {links.length ? (
        <div className="mt-4 flex flex-col gap-2">
          {links.map((item) => (
            <Button key={item.to} as={Link} to={item.to} variant="outline" className="h-10 rounded-xl">
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default ProviderNextSteps;
