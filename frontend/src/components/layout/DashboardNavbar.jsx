import { Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { logoAssets } from '../../assets/logos';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { ProfileDropdown } from '../common/ProfileDropdown';
import { ThemeToggle } from '../common/ThemeToggle';

export function DashboardNavbar({ title, subtitle, onOpenMenu }) {
  const { resolvedTheme } = useTheme();
  const dashboardMark = resolvedTheme === 'dark' ? logoAssets.logoMarkWhite : logoAssets.logoMarkColor;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/80 bg-surface/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground lg:hidden"
          aria-label="Open dashboard menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={dashboardMark} alt="SewaFi" className="hidden h-10 w-10 shrink-0 object-contain sm:block" decoding="async" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl text-foreground sm:text-2xl">{title}</p>
          {subtitle ? <p className="hidden text-sm text-muted sm:block">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </div>
  );
}

export default DashboardNavbar;
