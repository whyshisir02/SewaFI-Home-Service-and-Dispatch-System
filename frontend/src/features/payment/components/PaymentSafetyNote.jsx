import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Layout/Card';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';

export function PaymentSafetyNote() {
  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-[var(--sf-text-main)]">Payment Safety</h2>
          <p className="text-sm text-[var(--sf-text-muted)]">
            Only complete payments through supported SewaFi payment flows. If payment is unavailable, check your booking details or contact support.
          </p>
          <Button as={Link} to={ROUTES.contact} variant="outline" className="h-10 rounded-xl">
            Contact Support
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default PaymentSafetyNote;

