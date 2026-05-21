import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { ReviewSummary } from '../components/ReviewSummary';
import { ReviewList } from '../components/ReviewList';
import { useReviews } from '../hooks/useReviews';

function ReviewDetails() {
  const { data: reviews = [] } = useReviews('all');

  return (
    <Container className="space-y-8">
      <PageHeader eyebrow="Review details" title="Platform review summary" description="A consolidated view of ratings and review volume." />
      <ReviewSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </Container>
  );
}

export default ReviewDetails;
