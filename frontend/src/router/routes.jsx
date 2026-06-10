import { ROLES } from '../constants/roles.constant';
import { ROUTES } from '../constants/routes.constant';
import { lazyRoutes } from './lazyRoutes';

export const publicRoutes = [
  { path: ROUTES.home, component: lazyRoutes.public.Home },
  { path: ROUTES.services, component: lazyRoutes.public.ServicesPage },
  { path: ROUTES.serviceCategory, component: lazyRoutes.public.ServiceCategoryPage },
  { path: ROUTES.howItWorks, component: lazyRoutes.public.HowItWorks },
  { path: ROUTES.becomeProvider, component: lazyRoutes.public.BecomeProvider },
  { path: ROUTES.providerDetails, component: lazyRoutes.public.ProviderDetail },
  { path: ROUTES.serviceDetails, component: lazyRoutes.public.ServiceDetails },
  { path: ROUTES.about, component: lazyRoutes.public.About },
  { path: ROUTES.contact, component: lazyRoutes.public.Contact },
  { path: ROUTES.unauthorized, component: lazyRoutes.public.Unauthorized },
  { path: ROUTES.serverError, component: lazyRoutes.public.ServerError },
  { path: ROUTES.maintenance, component: lazyRoutes.public.Maintenance },
  { path: ROUTES.terms, component: lazyRoutes.public.Terms },
  { path: ROUTES.privacy, component: lazyRoutes.public.Privacy },
];

export const authRoutes = [
  { path: ROUTES.login, component: lazyRoutes.auth.Login },
  { path: ROUTES.register, component: lazyRoutes.auth.Register },
  { path: ROUTES.registerCustomer, component: lazyRoutes.auth.CustomerRegister },
  { path: ROUTES.registerProvider, component: lazyRoutes.auth.ProviderRegister },
  { path: ROUTES.verifyOtp, component: lazyRoutes.auth.VerifyOtp },
  { path: ROUTES.forgotPassword, component: lazyRoutes.auth.ForgotPassword },
  { path: ROUTES.resetPasswordVerifyOtp, component: lazyRoutes.auth.ResetPasswordOtp },
  { path: ROUTES.resetPassword, component: lazyRoutes.auth.ResetPassword },
];

export const customerRoutes = {
  role: ROLES.CUSTOMER,
  items: [
    { path: ROUTES.customer.dashboard, component: lazyRoutes.customer.Dashboard },
    { path: ROUTES.customer.notifications, component: lazyRoutes.customer.Notifications },
    { path: ROUTES.customer.services, component: lazyRoutes.customer.Services },
    { path: '/customer/book', component: lazyRoutes.customer.CreateBooking },
    { path: ROUTES.customer.book, component: lazyRoutes.customer.CreateBooking },
    { path: ROUTES.customer.bookings, component: lazyRoutes.customer.Bookings },
    { path: ROUTES.customer.addresses, component: lazyRoutes.customer.Addresses },
    { path: ROUTES.customer.bookingDetails, component: lazyRoutes.customer.BookingDetails },
    { path: ROUTES.customer.bookingTracking, component: lazyRoutes.customer.BookingTracking },
    { path: ROUTES.customer.payments, component: lazyRoutes.customer.Payments },
    { path: ROUTES.customer.paymentDetails, component: lazyRoutes.customer.PaymentDetails },
    { path: ROUTES.customer.receipts, component: lazyRoutes.customer.Receipts },
    { path: ROUTES.customer.receiptDetails, component: lazyRoutes.customer.ReceiptDetails },
    { path: ROUTES.customer.receiptByBooking, component: lazyRoutes.customer.ReceiptDetails },
    { path: ROUTES.customer.reviews, component: lazyRoutes.customer.Reviews },
    { path: ROUTES.customer.profile, component: lazyRoutes.customer.Profile },
  ],
};

export const providerRoutes = {
  role: ROLES.PROVIDER,
  items: [
    { path: ROUTES.provider.dashboard, component: lazyRoutes.provider.Dashboard },
    { path: ROUTES.provider.notifications, component: lazyRoutes.provider.Notifications },
    { path: ROUTES.provider.availability, component: lazyRoutes.provider.Availability },
    { path: ROUTES.provider.nearbyJobs, component: lazyRoutes.provider.NearbyJobs },
    { path: ROUTES.provider.assignedJobs, component: lazyRoutes.provider.AssignedJobs },
    { path: ROUTES.provider.assignedJobDetails, component: lazyRoutes.provider.AssignedJobDetails },
    { path: ROUTES.provider.jobs, component: lazyRoutes.provider.Jobs },
    { path: ROUTES.provider.jobDetails, component: lazyRoutes.provider.JobDetails },
    { path: ROUTES.provider.schedule, component: lazyRoutes.provider.Schedule },
    { path: ROUTES.provider.earnings, component: lazyRoutes.provider.Earnings },
    { path: ROUTES.provider.reviews, component: lazyRoutes.provider.Reviews },
    { path: ROUTES.provider.profile, component: lazyRoutes.provider.Profile },
    { path: ROUTES.provider.verification, component: lazyRoutes.provider.Verification },
  ],
};

export const adminRoutes = {
  role: ROLES.ADMIN,
  items: [
    { path: ROUTES.admin.dashboard, component: lazyRoutes.admin.Dashboard },
    { path: ROUTES.admin.users, component: lazyRoutes.admin.Users },
    { path: ROUTES.admin.providers, component: lazyRoutes.admin.Providers },
    { path: ROUTES.admin.bookings, component: lazyRoutes.admin.Bookings },
    { path: ROUTES.admin.bookingDetails, component: lazyRoutes.admin.BookingDetails },
    { path: ROUTES.admin.services, component: lazyRoutes.admin.Services },
    { path: ROUTES.admin.categories, component: lazyRoutes.admin.Categories },
    { path: ROUTES.admin.payments, component: lazyRoutes.admin.Payments },
    { path: ROUTES.admin.receipts, component: lazyRoutes.admin.Receipts },
    { path: ROUTES.admin.receiptDetails, component: lazyRoutes.admin.ReceiptDetails },
    { path: ROUTES.admin.receiptByPayment, component: lazyRoutes.admin.ReceiptDetails },
    { path: ROUTES.admin.support, component: lazyRoutes.admin.Support },
    { path: ROUTES.admin.auditLogs, component: lazyRoutes.admin.AuditLogs },
    { path: ROUTES.admin.reports, component: lazyRoutes.admin.Reports },
    { path: ROUTES.admin.reviews, component: lazyRoutes.admin.Reviews },
    { path: ROUTES.admin.notifications, component: lazyRoutes.admin.Notifications },
    { path: ROUTES.admin.analytics, component: lazyRoutes.admin.Analytics },
    { path: ROUTES.admin.settings, component: lazyRoutes.admin.Settings },
  ],
};
