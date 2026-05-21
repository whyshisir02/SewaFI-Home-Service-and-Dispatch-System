import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';

export function PaymentHeader({ backTo, onRefresh, refreshing }) {
  return (
    <PageHeader
      eyebrow="Payments"
      title="Payment"
      description="Review your booking payment details and complete payment if available."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to={backTo} variant="outline" className="h-11 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            Back to Booking Details
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh} loading={refreshing}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      )}
    />
  );
}

export default PaymentHeader;

