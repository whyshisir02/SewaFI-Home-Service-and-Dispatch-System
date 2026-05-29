import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardNavbar } from './DashboardNavbar';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Drawer } from '../ui/Overlay/Drawer';

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  mobileDrawerSide = 'right',
  mobileTitle,
  mobileSubtitle,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-shell flex min-h-screen overflow-x-hidden lg:h-screen lg:overflow-hidden">
      <DashboardSidebar items={navItems} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto lg:pl-72">
        <DashboardNavbar
          title={title}
          subtitle={subtitle}
          mobileTitle={mobileTitle}
          mobileSubtitle={mobileSubtitle}
          onOpenMenu={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-5 lg:pb-6">
          <Outlet />
        </main>
        <MobileBottomNav items={navItems} />
      </div>
      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Dashboard Menu" side={mobileDrawerSide}>
        <DashboardSidebar items={navItems} mobile onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
    </div>
  );
}

export default DashboardLayout;
