import { Link, useLocation } from 'react-router-dom';
import { Home, LockKeyhole, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { ROLES } from '../../../constants/roles.constant';
import { useAuth } from '../../../context/AuthContext';

const dashboardByRole = {
  [ROLES.CUSTOMER]: ROUTES.customer.dashboard,
  [ROLES.PROVIDER]: ROUTES.provider.dashboard,
  [ROLES.ADMIN]: ROUTES.admin.dashboard,
};

const roleMessageByRole = {
  [ROLES.CUSTOMER]: {
    subtitle: 'Customer accounts cannot access provider or admin pages.',
    ctaLabel: 'Go to Customer Dashboard',
  },
  [ROLES.PROVIDER]: {
    subtitle: 'Provider accounts cannot access customer-only or admin-only pages.',
    ctaLabel: 'Go to Provider Dashboard',
  },
  [ROLES.ADMIN]: {
    subtitle: 'Your admin account may not be allowed to access this specific area.',
    ctaLabel: 'Go to Admin Dashboard',
  },
};

function UnauthorizedPage() {
  const { user } = useAuth();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const stateReason = location.state?.reason;
  const queryReason = query.get('reason');
  const reason = String(stateReason || queryReason || '').trim().toUpperCase();

  const isProviderReview = reason === 'PROVIDER_NOT_APPROVED';
  const role = user?.role;
  const roleInfo = roleMessageByRole[role] || null;
  const primaryPath = dashboardByRole[role] || ROUTES.home;
  const showContact = Boolean(ROUTES.contact);
  const fromPath = location.state?.from;

  return (
    <main className="min-h-screen bg-[var(--sf-bg)] px-4 py-16">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center shadow-[var(--sf-shadow)] sm:p-8 lg:p-10">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
            {isProviderReview ? <LockKeyhole className="h-8 w-8" aria-hidden="true" /> : <ShieldAlert className="h-8 w-8" aria-hidden="true" />}
          </div>

          <p className="mt-5 inline-flex items-center rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--sf-primary)]">
            403 Access Restricted
          </p>

          <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
            {isProviderReview ? 'Provider Profile Under Review' : "You Don't Have Access to This Page"}
          </h1>

          <p className="mt-4 text-base leading-7 text-[var(--sf-text-muted)]">
            {isProviderReview
              ? 'Your provider account must be approved before accessing this provider feature.'
              : 'This page is limited to a different account role or permission level.'}
          </p>

          <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
            {isProviderReview
              ? 'You can continue to your provider profile or dashboard while approval is pending.'
              : roleInfo?.subtitle || 'We could not confirm your permission for this page.'}
          </p>

          {fromPath ? (
            <p className="mt-2 text-xs text-[var(--sf-text-muted)]">
              Tried to open: <span className="font-semibold text-[var(--sf-text-main)]">{fromPath}</span>
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isProviderReview ? (
              <Button as={Link} to={ROUTES.provider.profile} className="h-11 rounded-xl bg-[var(--sf-secondary)] px-6 text-white hover:brightness-95">
                View Provider Profile
              </Button>
            ) : (
              <Button as={Link} to={primaryPath} className="h-11 rounded-xl bg-[var(--sf-secondary)] px-6 text-white hover:brightness-95">
                {roleInfo?.ctaLabel || 'Go Home'}
              </Button>
            )}

            {isProviderReview ? (
              <Button as={Link} to={ROUTES.provider.dashboard} variant="outline" className="h-11 rounded-xl px-6">
                Go to Provider Dashboard
              </Button>
            ) : (
              <Button as={Link} to={ROUTES.home} variant="outline" className="h-11 rounded-xl px-6">
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Button>
            )}

            {showContact ? (
              <Button as={Link} to={ROUTES.contact} variant="ghost" className="h-11 rounded-xl px-6">
                Contact Support
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export default UnauthorizedPage;
