import { NAV_LINKS } from '../../config/route.config';
import { DashboardLayout } from './DashboardLayout';

export function CustomerLayout() {
  return <DashboardLayout title="Customer Console" subtitle="Book, track, pay, and review with confidence." navItems={NAV_LINKS.customer} />;
}

export default CustomerLayout;
