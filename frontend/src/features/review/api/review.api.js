import { api, unwrapResponse } from '../../../lib/axios';

const isMissingEndpoint = (error) => [404, 405].includes(error?.response?.status);

const toUnsupportedReviewsError = () => {
  const error = new Error('Review endpoint is not available');
  error.code = 'REVIEW_ENDPOINT_UNAVAILABLE';
  return error;
};

const requestFirstAvailableGet = async (endpoints, config = {}) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint, config);
      return unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedReviewsError();
};

const requestFirstAvailablePost = async (endpoints, payload) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, payload);
      return unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedReviewsError();
};

export const reviewApi = {
  my: (params) => requestFirstAvailableGet(['/reviews/my', '/customer/reviews', '/reviews/my-reviews'], { params }),
  received: (params) => requestFirstAvailableGet(['/reviews/received', '/provider/reviews'], { params }),
  all: (params) => requestFirstAvailableGet(['/admin/reviews', '/reviews/all'], { params }),
  provider: (providerId, params) =>
    requestFirstAvailableGet([`/providers/${providerId}/reviews`, `/reviews/provider/${providerId}`], { params }),
  create: async (payload) => {
    const bookingId = payload?.bookingId;
    if (bookingId) {
      return requestFirstAvailablePost([`/bookings/${bookingId}/review`, '/reviews'], payload);
    }
    return requestFirstAvailablePost(['/reviews'], payload);
  },
};
