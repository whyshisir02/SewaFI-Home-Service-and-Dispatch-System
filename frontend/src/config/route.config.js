import { ROUTES } from '../constants/routes.constant';
import { ROLES } from '../constants/roles.constant';
import {
  Bell,
  BriefcaseBusiness,
  CalendarRange,
  CreditCard,
  LifeBuoy,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Settings,
  Star,
  Tag,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';

export const NAV_LINKS = {
  public: [
    { label: 'Home', path: ROUTES.home },
    { label: 'Services', path: ROUTES.services },
    { label: 'About', path: ROUTES.about },
    { label: 'Contact', path: ROUTES.contact },
  ],
  customer: [
    { label: 'Dashboard', path: ROUTES.customer.dashboard, icon: LayoutDashboard },
    { label: 'Book a Service', path: '/customer/book', icon: Wrench },
    { label: 'Bookings', path: ROUTES.customer.bookings, icon: CalendarRange },
    { label: 'Notifications', path: ROUTES.customer.notifications, icon: Bell },
    { label: 'Addresses', path: ROUTES.customer.addresses, icon: MapPinned },
    { label: 'Payments', path: ROUTES.customer.payments, icon: CreditCard },
    { label: 'Reviews', path: ROUTES.customer.reviews, icon: Star },
    { label: 'Profile', path: ROUTES.customer.profile, icon: UserRound },
    { label: 'Help', path: ROUTES.contact, icon: LifeBuoy },
  ],
  provider: [
    { label: 'Dashboard', path: ROUTES.provider.dashboard, icon: LayoutDashboard },
    { label: 'Availability', path: ROUTES.provider.availability, icon: CalendarRange },
    { label: 'Nearby Jobs', path: ROUTES.provider.nearbyJobs, icon: MapPinned },
    { label: 'Assigned Jobs', path: ROUTES.provider.assignedJobs, icon: BriefcaseBusiness },
    { label: 'Jobs', path: ROUTES.provider.jobs, icon: BriefcaseBusiness },
    { label: 'Schedule', path: ROUTES.provider.schedule, icon: CalendarRange },
    { label: 'Earnings', path: ROUTES.provider.earnings, icon: CreditCard },
    { label: 'Notifications', path: ROUTES.provider.notifications, icon: Bell },
    { label: 'Reviews', path: ROUTES.provider.reviews, icon: Star },
    { label: 'Profile', path: ROUTES.provider.profile, icon: UserRound },
    { label: 'Application Status', path: ROUTES.provider.verification, icon: ShieldCheck },
    { label: 'Help', path: ROUTES.contact, icon: LifeBuoy },
  ],
  admin: [
    { label: 'Dashboard', path: ROUTES.admin.dashboard, icon: LayoutDashboard },
    { label: 'Users', path: ROUTES.admin.users, icon: Users },
    { label: 'Providers', path: ROUTES.admin.providers, icon: ShieldCheck },
    { label: 'Bookings', path: ROUTES.admin.bookings, icon: CalendarRange },
    { label: 'Services', path: ROUTES.admin.services, icon: Wrench },
    { label: 'Categories', path: ROUTES.admin.categories, icon: Tag },
    { label: 'Payments', path: ROUTES.admin.payments, icon: CreditCard },
    { label: 'Support', path: ROUTES.admin.support, icon: LifeBuoy },
    { label: 'Reviews', path: ROUTES.admin.reviews, icon: Star },
    { label: 'Notifications', path: ROUTES.admin.notifications, icon: Bell },
    { label: 'Settings', path: ROUTES.admin.settings, icon: Settings },
  ],
};

export const DASHBOARD_ROLES = [ROLES.CUSTOMER, ROLES.PROVIDER, ROLES.ADMIN];
