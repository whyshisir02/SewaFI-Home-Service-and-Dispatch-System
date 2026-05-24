import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes.constant';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { logoAssets } from '../../../assets/logos';
import { AuthBrandPanel } from '../../../components/auth/AuthBrandPanel';
import { LoginForm } from '../components/LoginForm';

const getDashboardRoute = (user) => {
  if (user?.role === 'CUSTOMER') return ROUTES.customer.dashboard;
  if (user?.role === 'ADMIN') return ROUTES.admin.dashboard;

  if (user?.role === 'PROVIDER') {
    const status = user?.providerStatus || user?.providerProfile?.status;

    if (status && status !== 'APPROVED') {
      return ROUTES.provider.verification;
    }

    return ROUTES.provider.dashboard;
  }

  return ROUTES.home;
};

const safeRedirect = (redirect) => (redirect?.startsWith('/') ? redirect : null);

function Login() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const authLogo = resolvedTheme === 'dark' ? logoAssets.logoAuthWhite : logoAssets.logoAuth;

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return;
    const redirect = safeRedirect(redirectParam) || getDashboardRoute(user);
    navigate(redirect, { replace: true });
  }, [isAuthenticated, isBootstrapping, navigate, redirectParam, user]);

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--sf-bg)] px-4">
        <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-5 py-4 text-sm font-semibold text-[var(--sf-text-muted)]">
          Checking your session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,var(--sf-secondary-soft),transparent_30%),radial-gradient(circle_at_85%_5%,var(--sf-primary-soft),transparent_28%),var(--sf-bg)] px-4 py-6 text-[var(--sf-text-main)] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <header className="flex items-center justify-between">
          <Link to={ROUTES.home} className="inline-flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]">
            <img src={authLogo} alt="SewaFi logo" className="h-12 w-auto object-contain" decoding="async" />
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[var(--sf-text-muted)] sm:inline-flex">
            <ShieldCheck className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
            Secure account access
          </div>
        </header>

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 lg:order-1">
            <AuthBrandPanel />
          </div>

          <section className="order-1 lg:order-2">
            <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)] sm:p-8">
              <div className="mb-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
                  <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                </span>
                <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
                  Login to your account
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">Enter your details to continue.</p>
              </div>

              <LoginForm />
            </div>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]/75 p-4 text-center text-xs leading-5 text-[var(--sf-text-muted)]">
              Secure login gives you access to role-based dashboards for customers, providers, and admins.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;
