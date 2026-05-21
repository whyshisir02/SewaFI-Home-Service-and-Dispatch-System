import { NAV_LINKS } from '../../config/route.config';
import { DashboardLayout } from './DashboardLayout';

export function ProviderLayout() {
  return <DashboardLayout title="Provider Workspace" subtitle="Manage availability, jobs, earnings, and verification." navItems={NAV_LINKS.provider} />;
}

export default ProviderLayout;
