export const SOCKET_EVENTS = {
  notificationNew: 'notification:new',
  customer: {
    bookingCreated: 'booking:created',
    bookingSearchingProvider: 'booking:searching_provider',
    bookingAccepted: 'booking:accepted',
    bookingStatusUpdated: 'booking:status_updated',
    bookingCompleted: 'booking:completed',
    bookingCancelled: 'booking:cancelled',
    paymentUpdated: 'payment:updated',
  },
  provider: {
    newNearbyJob: 'provider:new_nearby_job',
    jobTakenByOther: 'provider:job_taken_by_other',
    scheduleUpdated: 'provider:schedule_updated',
    backendNewJob: 'job:new',
    backendJobTaken: 'job:taken',
  },
  admin: {
    newBooking: 'admin:new_booking',
    providerAccepted: 'admin:provider_accepted',
    paymentUpdated: 'admin:payment_updated',
    newReview: 'admin:new_review',
  },
  tracking: {
    subscribe: 'tracking:subscribe',
    snapshot: 'tracking:snapshot',
    update: 'tracking:update',
    stop: 'tracking:stop',
    error: 'tracking:error',
  },
};
