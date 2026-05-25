import { Link, useInRouterContext } from 'react-router-dom';
import { Home, LifeBuoy, RefreshCw, ServerCrash } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';
import { ROLES } from '../../constants/roles.constant';
import { useAuth } from '../../context/AuthContext';

const dashboardByRole = {
  [ROLES.CUSTOMER]: { path: ROUTES.customer.dashboard, label: 'Go to Customer Dashboard' },
  [ROLES.PROVIDER]: { path: ROUTES.provider.dashboard, label: 'Go to Provider Dashboard' },
  [ROLES.ADMIN]: { path: ROUTES.admin.dashboard, label: 'Go to Admin Dashboard' },
};

export function ServerErrorView({ onRetry, allowRoleCta = true, details, inBoundary = false }) {
  const { user } = useAuth();
  const inRouter = useInRouterContext();
  const roleCta = allowRoleCta ? dashboardByRole[user?.role] : null;
  const retry = onRetry || (() => window.location.reload());
  const showContact = Boolean(ROUTES.contact);
  const showDevDetails = Boolean(import.meta.env.DEV && details);
  const goTo = (path) => () => window.location.assign(path);

  return (
    <main className={`${inBoundary ? 'min-h-[60vh]' : 'min-h-screen'} flex items-center justify-center bg-[var(--sf-bg)] px-4 py-16`}>
      <section className="w-full max-w-3xl rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center shadow-[var(--sf-shadow)] sm:p-8 lg:p-10">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <ServerCrash className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="mt-5 inline-flex items-center rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--sf-primary)]">
          500 Server Error
        </p>

        <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
          Something Went Wrong
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--sf-text-muted)]">
          SewaFi couldn&apos;t load this page properly. This may be a temporary issue.
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
          Please try again. If the problem continues, you can go back to the dashboard or contact support.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={retry} className="h-11 rounded-xl bg-[var(--sf-secondary)] px-6 text-white hover:brightness-95">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          {inRouter ? (
            <Button as={Link} to={ROUTES.home} variant="outline" className="h-11 rounded-xl px-6">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </Button>
          ) : (
            <Button type="button" onClick={goTo(ROUTES.home)} variant="outline" className="h-11 rounded-xl px-6">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </Button>
          )}
          {roleCta ? (
            inRouter ? (
              <Button as={Link} to={roleCta.path} variant="outline" className="h-11 rounded-xl px-6">
                {roleCta.label}
              </Button>
            ) : (
              <Button type="button" onClick={goTo(roleCta.path)} variant="outline" className="h-11 rounded-xl px-6">
                {roleCta.label}
              </Button>
            )
          ) : null}
          {showContact ? (
            inRouter ? (
              <Button as={Link} to={ROUTES.contact} variant="ghost" className="h-11 rounded-xl px-6">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Contact Support
              </Button>
            ) : (
              <Button type="button" onClick={goTo(ROUTES.contact)} variant="ghost" className="h-11 rounded-xl px-6">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Contact Support
              </Button>
            )
          ) : null}
        </div>

        {showDevDetails ? (
          <details className="mt-6 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4 text-left">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--sf-text-main)]">
              Technical details (development only)
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-[var(--sf-text-muted)]">
              {details}
            </pre>
          </details>
        ) : null}
      </section>
    </main>
  );
}

export default ServerErrorView;
