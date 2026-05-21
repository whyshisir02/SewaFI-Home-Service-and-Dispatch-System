import { NAV_LINKS } from '../../config/route.config';
import { DashboardLayout } from './DashboardLayout';

export function AdminLayout() {
  return <DashboardLayout title="Admin Operations" subtitle="Run approval queues, bookings, payments, and analytics." navItems={NAV_LINKS.admin} />;
}

export default AdminLayout;
