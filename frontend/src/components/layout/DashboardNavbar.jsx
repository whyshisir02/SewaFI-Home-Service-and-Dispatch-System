import { Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { logoAssets } from '../../assets/logos';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { ProfileDropdown } from '../common/ProfileDropdown';
import { ThemeToggle } from '../common/ThemeToggle';
import { cn } from '../../lib/cn';

export function DashboardNavbar({ title, subtitle, mobileTitle, mobileSubtitle, onOpenMenu }) {
  const { resolvedTheme } = useTheme();
  const dashboardMark = resolvedTheme === 'dark' ? logoAssets.logoMarkWhite : logoAssets.logoMarkColor;
  const showMobileSubtitle = Boolean(mobileSubtitle);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/80 bg-surface/95 px-3 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground lg:hidden"
          aria-label="Open dashboard menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={dashboardMark} alt="SewaFi" className="hidden h-10 w-10 shrink-0 object-contain sm:block" decoding="async" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-foreground sm:text-2xl">
            <span className="lg:hidden">{mobileTitle || title}</span>
            <span className="hidden lg:inline">{title}</span>
          </p>
          {(subtitle || mobileSubtitle) ? (
            <p
              className={cn(
                'truncate text-xs text-muted lg:text-sm',
                showMobileSubtitle ? 'block max-w-[11rem] sm:max-w-[20rem] lg:max-w-none' : 'hidden sm:block'
              )}
            >
              <span className="lg:hidden">{mobileSubtitle || subtitle}</span>
              <span className="hidden lg:inline">{subtitle}</span>
            </p>
          ) : null}
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
