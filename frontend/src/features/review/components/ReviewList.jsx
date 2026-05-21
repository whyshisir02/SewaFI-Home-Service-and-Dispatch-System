import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { ReviewCard } from './ReviewCard';

export function ReviewList({ reviews = [], role = 'customer', emptyTitle = 'No reviews yet', emptyDescription = 'Completed bookings with customer feedback will appear here.', renderActions }) {
  if (!reviews.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id || review.createdAt}
          review={review}
          role={role}
          actions={renderActions ? renderActions(review) : null}
        />
      ))}
    </div>
  );
}

export default ReviewList;
