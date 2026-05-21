import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { CustomerDashboardHeader } from '../../../components/customer/CustomerDashboardHeader';
import { CustomerStatsGrid } from '../../../components/customer/CustomerStatsGrid';
import { ActiveBookingCard } from '../../../components/customer/ActiveBookingCard';
import { RecentBookingsTable } from '../../../components/customer/RecentBookingsTable';
import { RecommendedServices } from '../../../components/customer/RecommendedServices';
import { NotificationsPreview } from '../../../components/customer/NotificationsPreview';
import { ACTIVE_BOOKING_STATUSES, sortByRecent, toArray } from '../../../components/customer/dashboardUtils';
import { useCustomerDashboard } from '../hooks/useCustomerDashboard';
import { useBookingSocket } from '../../booking/hooks/useBookingSocket';
import { useNotificationSocket } from '../../notification/hooks/useNotificationSocket';

function SectionError({ title, onRetry }) {
  return (
    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <p className="font-semibold text-[var(--sf-text-main)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh this section or try again shortly.</p>
      {onRetry ? (
        <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function CustomerDashboard() {
  useBookingSocket();
  useNotificationSocket();

  const { user } = useAuth();
  const { summaryQuery, bookingsQuery, servicesQuery, notificationsQuery } = useCustomerDashboard();

  const bookings = toArray(bookingsQuery.data, ['bookings']).filter(Boolean);
  const recommendedServices = toArray(servicesQuery.data, ['services']).filter((service) => service?.isActive !== false);
  const notifications = toArray(notificationsQuery.data, ['notifications']).filter(Boolean);
  const activeBooking = sortByRecent(bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking?.status)))[0];

  const isBookingsLoading = bookingsQuery.isLoading || summaryQuery.isLoading;

  return (
    <Container className="space-y-8 pb-24 lg:pb-0">
      <CustomerDashboardHeader user={user} />

      {bookingsQuery.isError ? (
        <SectionError title="Unable to load dashboard data right now." onRetry={() => bookingsQuery.refetch()} />
      ) : null}

      <CustomerStatsGrid bookings={bookings} isLoading={isBookingsLoading && !bookings.length} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Now tracking</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Active Booking</h2>
          </div>
          <ActiveBookingCard booking={activeBooking} isLoading={isBookingsLoading && !bookings.length} />
        </div>

        <NotificationsPreview
          notifications={notifications}
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
        />
      </section>

      {summaryQuery.isError && !bookingsQuery.isError ? (
        <SectionError title="Dashboard summary is temporarily unavailable, so stats are derived from your bookings." onRetry={() => summaryQuery.refetch()} />
      ) : null}

      <RecentBookingsTable bookings={bookings} isLoading={bookingsQuery.isLoading} />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Book again</p>
            <h2 className="text-2xl font-extrabold text-[var(--sf-text-main)]">Recommended Services</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--sf-text-muted)]">
            Real services from SewaFi&apos;s backend, ready to start a new booking.
          </p>
        </div>
        <RecommendedServices
          services={recommendedServices}
          isLoading={servicesQuery.isLoading}
          isError={servicesQuery.isError}
        />
      </section>
    </Container>
  );
}

export default CustomerDashboard;
