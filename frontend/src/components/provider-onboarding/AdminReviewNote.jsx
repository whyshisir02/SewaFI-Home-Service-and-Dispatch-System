import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Layout/Card';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';
import { PROVIDER_STATUS } from '../../constants/provider-status.constant';

export function AdminReviewNote({ providerProfile }) {
  const note = providerProfile?.rejectionReason || providerProfile?.adminNote || '';
  const isRejected = providerProfile?.status === PROVIDER_STATUS.REJECTED;

  if (!note && !isRejected) return null;

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Admin Feedback</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
            {note || 'No detailed reason was provided. Please contact support for more information.'}
          </p>
          <Button as={Link} to={ROUTES.contact} variant="outline" className="mt-4 h-10 rounded-xl">
            Contact Support
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AdminReviewNote;
