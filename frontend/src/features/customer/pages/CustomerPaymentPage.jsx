import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { Card } from '../../../components/ui/Layout/Card';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { AmountBreakdownCard } from '../../payment/components/AmountBreakdownCard';
import { BookingPaymentSummary } from '../../payment/components/BookingPaymentSummary';
import { PaymentActionPanel } from '../../payment/components/PaymentActionPanel';
import { PaymentMethodSelector } from '../../payment/components/PaymentMethodSelector';
import { PaymentSafetyNote } from '../../payment/components/PaymentSafetyNote';
import { PaymentStatusResult } from '../../payment/components/PaymentStatusResult';
import { ReviewForm } from '../../review/components/ReviewForm';
import {
  useConfirmPayment,
  useCustomerPayment,
  useDisputePayment,
  usePaymentMethods,
} from '../../payment/hooks/useCustomerPayment';

function CustomerPaymentPage() {
  const { bookingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [showDisputeBox, setShowDisputeBox] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [justConfirmedPayment, setJustConfirmedPayment] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const paymentQuery = useCustomerPayment(bookingId);
  const methodsQuery = usePaymentMethods();
  const confirmMutation = useConfirmPayment();
  const disputeMutation = useDisputePayment();

  const payment = paymentQuery.data;
  const booking = payment?.booking || payment;
  const existingReview = payment?.review || booking?.review || null;
  const reviewProviderId = booking?.providerId || booking?.provider?.id || null;
  const methods = useMemo(() => {
    if (Array.isArray(methodsQuery.data) && methodsQuery.data.length) return methodsQuery.data;
    return ['CASH', 'MANUAL'];
  }, [methodsQuery.data]);
  const paymentStatus = String(payment?.paymentStatus || booking?.paymentStatus || 'PENDING').toUpperCase();
  const awaitingConfirmation = paymentStatus === 'AWAITING_CONFIRMATION';
  const paid = paymentStatus === 'PAID';
  const receiptPath = bookingId
    ? ROUTES.customer.receiptByBooking.replace(':bookingId', bookingId)
    : ROUTES.customer.receipts;
  const reviewPath = bookingId
    ? `${ROUTES.customer.reviews}?bookingId=${encodeURIComponent(bookingId)}`
    : ROUTES.customer.reviews;
  const hasProposedAmount =
    Number(payment?.providerProposedAmount ?? booking?.providerProposedAmount ?? 0) > 0;
  const paymentReadyForReview =
    hasProposedAmount || ['AWAITING_CONFIRMATION', 'PAID', 'DISPUTED', 'CONFIRMED'].includes(paymentStatus);
  const reviewPromptRequested = searchParams.get('reviewPrompt') === '1';
  const bookingCompleted = String(booking?.status || '').toUpperCase() === 'COMPLETED';
  const canShowReviewPromptFromLink =
    reviewPromptRequested && paid && bookingCompleted && !existingReview;

  useEffect(() => {
    if ((!paid || !justConfirmedPayment) && !canShowReviewPromptFromLink) {
      return undefined;
    }

    if (existingReview || showReviewPrompt) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowReviewPrompt(true);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [canShowReviewPromptFromLink, existingReview, justConfirmedPayment, paid, showReviewPrompt]);

  const onConfirmPayment = async () => {
    if (!bookingId) return;
    try {
      await confirmMutation.mutateAsync({
        bookingId,
        paymentMethod: selectedMethod || 'CASH',
        customerNote: 'Paid and confirmed by customer.',
      });
      appToast.success('Payment confirmed successfully.');
      setJustConfirmedPayment(true);
      setShowDisputeBox(false);
      setDisputeReason('');
      paymentQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to confirm payment right now.'));
    }
  };

  const onDisputePayment = async () => {
    if (!bookingId || !disputeReason.trim()) {
      appToast.error('Please provide a dispute reason.');
      return;
    }
    try {
      await disputeMutation.mutateAsync({ bookingId, reason: disputeReason.trim() });
      appToast.success('Payment issue submitted. Our team will review it.');
      setShowDisputeBox(false);
      setDisputeReason('');
      paymentQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to submit dispute right now.'));
    }
  };

  if (paymentQuery.isLoading) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (paymentQuery.isError) {
    return (
      <Container className="py-8">
        <Card className="rounded-2xl p-6">
          <EmptyState title="Unable to load payment details right now." />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" className="rounded-xl" onClick={() => paymentQuery.refetch()}>
              Retry
            </Button>
            <Button as={Link} to={ROUTES.customer.bookings} variant="outline" className="rounded-xl">
              Back to Bookings
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  if (!payment) {
    return (
      <Container className="py-8">
        <Card className="rounded-2xl p-6">
          <EmptyState
            title="Payment not available yet."
            description="Payment will be available after provider submits the final amount."
          />
          <div className="mt-4">
            <Button as={Link} to={ROUTES.customer.bookings} variant="outline" className="rounded-xl">
              Back to Bookings
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  if (!paymentReadyForReview) {
    return (
      <Container className="py-8">
        <Card className="rounded-2xl p-6">
          <EmptyState
            title="Payment not available yet."
            description="Payment will be available after provider submits the final amount."
          />
          <div className="mt-4">
            <Button as={Link} to={ROUTES.customer.bookings} variant="outline" className="rounded-xl">
              Back to Bookings
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Customer Payment"
        title="Confirm Final Payment"
        description="Review provider-submitted final amount and confirm only after service completion."
        actions={(
          <Button as={Link} to={ROUTES.customer.bookings} variant="outline" className="h-11 rounded-xl">
            Back to Bookings
          </Button>
        )}
      />

      <BookingPaymentSummary booking={booking} payment={payment} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <AmountBreakdownCard payment={payment} booking={booking} />
          {payment?.providerNote ? (
            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h2 className="text-base font-bold text-[var(--sf-text-main)]">Provider Note</h2>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{payment.providerNote}</p>
            </Card>
          ) : null}
          {awaitingConfirmation ? (
            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="flex items-start gap-2 text-sm text-[var(--sf-text-muted)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--sf-warning)]" />
                Please confirm only after the service is completed and the amount is correct.
              </p>
            </Card>
          ) : null}
          {showDisputeBox ? (
            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h2 className="text-base font-bold text-[var(--sf-text-main)]">Raise Payment Issue</h2>
              <textarea
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Describe why you are disputing this final amount..."
                className="mt-3 min-h-28 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2 text-sm text-[var(--sf-text-main)] outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-10 rounded-xl"
                  onClick={onDisputePayment}
                  loading={disputeMutation.isPending}
                >
                  Submit Issue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => {
                    setShowDisputeBox(false);
                    setDisputeReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <PaymentMethodSelector
            methods={methods}
            value={selectedMethod}
            onChange={setSelectedMethod}
            unavailable={false}
          />
          <PaymentActionPanel
            paymentStatus={paymentStatus}
            onConfirmPayment={onConfirmPayment}
            onRaiseIssue={() => setShowDisputeBox(true)}
            confirmLoading={confirmMutation.isPending}
            disputeLoading={disputeMutation.isPending}
            canAct={awaitingConfirmation}
          />
          <PaymentStatusResult
            paymentStatus={paymentStatus}
            paidAt={payment?.paidAt}
            verifying={paymentQuery.isFetching && !paymentQuery.isLoading}
          />
          <PaymentSafetyNote />
          {paid ? (
            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="text-sm text-[var(--sf-text-muted)]">
                Payment completed successfully. Your receipt is ready.
              </p>
              <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                <Button as={Link} to={receiptPath} variant="outline" className="h-10 rounded-xl">
                  View Receipt
                </Button>
                {existingReview ? (
                  <Button as={Link} to={ROUTES.customer.reviews} variant="ghost" className="h-10 rounded-xl">
                    Review Submitted
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
                    onClick={() => setShowReviewPrompt((current) => !current)}
                  >
                    Rate Service
                  </Button>
                )}
              </div>
            </Card>
          ) : null}
          {paid && !existingReview && showReviewPrompt ? (
            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h2 className="text-base font-bold text-[var(--sf-text-main)]">Rate Your Service</h2>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
                Share your experience with the completed service while the details are still fresh.
              </p>
              {bookingId && reviewProviderId ? (
                <div className="mt-4">
                  <ReviewForm
                    bookingId={bookingId}
                    providerId={reviewProviderId}
                    onSuccess={() => {
                      setShowReviewPrompt(false);
                      if (reviewPromptRequested) {
                        const next = new URLSearchParams(searchParams);
                        next.delete('reviewPrompt');
                        setSearchParams(next, { replace: true });
                      }
                      paymentQuery.refetch();
                    }}
                  />
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button as={Link} to={reviewPath} className="h-10 rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
                    Open Review Page
                  </Button>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

export default CustomerPaymentPage;
