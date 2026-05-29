import { NAV_LINKS } from '../../config/route.config';
import { DashboardLayout } from './DashboardLayout';

export function AdminLayout() {
  return (
    <DashboardLayout
      title="Admin Operations"
      subtitle="Run approval queues, bookings, payments, and analytics."
      mobileTitle="Admin Ops"
      mobileSubtitle="Approvals, bookings, payments"
      navItems={NAV_LINKS.admin}
      mobileDrawerSide="left"
    />
  );
}

export default AdminLayout;
