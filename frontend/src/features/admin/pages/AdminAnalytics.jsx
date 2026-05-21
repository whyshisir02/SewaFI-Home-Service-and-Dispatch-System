import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { BookingTrendChart } from '../components/BookingTrendChart';
import { CategoryAnalyticsChart } from '../components/CategoryAnalyticsChart';
import { RevenueChart } from '../components/RevenueChart';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';

function AdminAnalytics() {
  const analytics = useAdminAnalytics();

  return (
    <Container className="space-y-8">
      <PageHeader eyebrow="Analytics" title="Operations analytics" description="Compare booking movement, revenue, and category distribution on a dedicated admin analytics screen." />
      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueChart data={analytics.revenueQuery.data} />
        <BookingTrendChart data={analytics.bookingStatusQuery.data} />
        <CategoryAnalyticsChart data={analytics.categoriesQuery.data} />
      </div>
    </Container>
  );
}

export default AdminAnalytics;
