import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { PUBLIC_NAV_LINKS } from '../../constants/public-nav.constant';
import { ROUTES } from '../../constants/routes.constant';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';
import { logoAssets } from '../../assets/logos';
import { Button } from '../ui/Button/Button';
import { Container } from '../ui/Layout/Container';
import { Drawer } from '../ui/Overlay/Drawer';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { ThemeToggle } from './ThemeToggle';

const nepaliTagline = '\u0938\u0947\u0935\u093e \u0939\u093e\u092e\u094d\u0930\u094b, \u0938\u0941\u0935\u093f\u0927\u093e \u0924\u092a\u093e\u0908\u0902\u0915\u094b';
const defaultBookingPath = ROUTES.customer.book.replace(':serviceId', 'new');

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navbarLogo = resolvedTheme === 'dark' ? logoAssets.logoNavbarWhite : logoAssets.logoNavbar;

  const isLinkActive = (item) => {
    if (item.mode === 'hash') {
      return location.pathname === ROUTES.home && location.hash === item.hash;
    }

    if (item.to === ROUTES.home) {
      return location.pathname === ROUTES.home && !location.hash;
    }

    if (item.to === ROUTES.services) {
      return location.pathname.startsWith(ROUTES.services);
    }

    if (item.to?.startsWith(ROUTES.register)) {
      return location.pathname.startsWith(ROUTES.register);
    }

    return location.pathname === item.to;
  };

  const renderNavLink = (item, mobile = false) => {
    const active = isLinkActive(item);
    const baseClass = mobile
      ? 'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition'
      : 'relative px-1 py-2 text-sm font-semibold transition';
    const activeClass = mobile
      ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]'
      : 'text-[var(--sf-secondary)]';
    const inactiveClass = mobile
      ? 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)] hover:border-[var(--sf-secondary)] hover:text-[var(--sf-secondary)]'
      : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]';

    const content = (
      <span className={cn(baseClass, active ? activeClass : inactiveClass)}>
        {item.label}
        {mobile ? null : <span className={cn('absolute -bottom-[18px] left-0 h-0.5 w-full rounded-full bg-[var(--sf-secondary)] transition', active ? 'opacity-100' : 'opacity-0')} />}
      </span>
    );

    if (item.mode === 'hash') {
      return (
        <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>
          {content}
        </a>
      );
    }

    return (
      <Link key={item.label} to={item.to} onClick={() => setMobileMenuOpen(false)}>
        {content}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] backdrop-blur-xl transition">
        <Container className="flex h-20 items-center justify-between gap-3 sm:gap-4">
          {/* <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={navbarLogo} alt={`${APP_CONFIG.name} logo`} className="h-10 w-auto object-contain" decoding="async" />
            <div className="min-w-0">
              <p className="truncate font-display text-xl text-[var(--sf-text-main)]">{APP_CONFIG.name}</p>
              <p className="hidden truncate text-xs text-[var(--sf-text-muted)] sm:block">{nepaliTagline}</p>
            </div>
          </Link> */}

          <Link to="/" className="flex flex-col">
            <img
              src={navbarLogo}
              alt={`${APP_CONFIG.name} logo`}
              className="h-12 w-auto object-contain"
              decoding="async"
            />

            <div className="ml-12">
              <p className="mt-1 hidden text-xs font-medium text-[var(--sf-text-muted)] sm:block">
                {nepaliTagline}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {PUBLIC_NAV_LINKS.map((link) => renderNavLink(link))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button
                  as={Link}
                  to={defaultBookingPath}
                  className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
                >
                  Book Now
                </Button>
                <NotificationDropdown />
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  to={ROUTES.login}
                  variant="ghost"
                  className="text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-soft)] hover:text-[var(--sf-text-main)]"
                >
                  Login
                </Button>
                <Button as={Link} to={ROUTES.register} variant="outline" className="rounded-xl">
                  Register
                </Button>
                <Button
                  as={Link}
                  to={`${ROUTES.login}?redirect=${encodeURIComponent(defaultBookingPath)}`}
                  state={{ from: defaultBookingPath }}
                  className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
                >
                  Book Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            {isAuthenticated ? <NotificationDropdown /> : null}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition hover:border-[var(--sf-secondary)] hover:text-[var(--sf-secondary)]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </header>

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="SewaFi Menu">
        <div className="space-y-5">
          <div>
            <p className="text-sm text-[var(--sf-text-muted)]">Trusted dispatch-ready home services for homes and communities across Nepal.</p>
          </div>
          <nav className="grid gap-3">{PUBLIC_NAV_LINKS.map((link) => renderNavLink(link, true))}</nav>
          {isAuthenticated ? (
            <div className="grid gap-3 pt-2">
              <Button as={Link} to={defaultBookingPath} onClick={() => setMobileMenuOpen(false)} className="bg-[var(--sf-accent)] text-white hover:brightness-95">
                Book Now
              </Button>
              <ProfileDropdown />
            </div>
          ) : (
            <div className="grid gap-3 pt-2">
              <Button as={Link} to={ROUTES.login} variant="outline" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Button>
              <Button as={Link} to={ROUTES.register} variant="outline" onClick={() => setMobileMenuOpen(false)}>
                Register
              </Button>
              <Button
                as={Link}
                to={`${ROUTES.login}?redirect=${encodeURIComponent(defaultBookingPath)}`}
                state={{ from: defaultBookingPath }}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[var(--sf-accent)] text-white hover:brightness-95"
              >
                Book Now
              </Button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--sf-text-muted)] transition hover:text-[var(--sf-text-main)]"
          >
            <X className="h-4 w-4" />
            Close menu
          </button>
        </div>
      </Drawer>
    </>
  );
}

export default Navbar;
