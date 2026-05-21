import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button/Button';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { useCreateReview } from '../hooks/useReviews';
import { reviewSchema } from '../validators/review.schema';
import { StarRatingInput } from './StarRatingInput';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';

export function ReviewForm({ bookingId, providerId, onSuccess }) {
  const createReviewMutation = useCreateReview();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId,
      providerId,
      rating: 5,
      comment: '',
    },
  });

  const ratingValue = watch('rating');

  const submitReview = (values) => {
    createReviewMutation.mutate(values, {
      onSuccess: () => {
        appToast.success('Review submitted successfully.');
        reset({
          bookingId,
          providerId: providerId || '',
          rating: 5,
          comment: '',
        });
        onSuccess?.();
      },
      onError: (error) => {
        appToast.error(getErrorMessage(error, 'Unable to submit review right now.'));
      },
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitReview)}>
      <input type="hidden" {...register('bookingId')} />
      <input type="hidden" {...register('providerId')} />
      <StarRatingInput
        value={ratingValue}
        onChange={(next) => setValue('rating', next, { shouldDirty: true, shouldValidate: true })}
        disabled={createReviewMutation.isPending}
      />
      {errors.rating?.message ? <p className="text-xs text-danger">{errors.rating?.message}</p> : null}
      <Textarea
        label="Comment"
        placeholder="Tell us about your service experience..."
        error={errors.comment?.message}
        {...register('comment')}
      />
      <Button type="submit" loading={createReviewMutation.isPending} className="h-11 rounded-xl">
        {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}

export default ReviewForm;
