import { Outlet, useLocation } from 'react-router-dom';
import { Container } from '../ui/Layout/Container';

export function AuthLayout() {
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname.startsWith('/register')) {
    return <Outlet />;
  }

  return (
    <div className="app-shell flex min-h-screen items-center py-12">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] border border-border/70 bg-surface/80 p-10 shadow-soft lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">SewaFi Access</p>
          <h1 className="mt-4 font-display text-5xl text-foreground">Trust, dispatch, and service quality in one workflow.</h1>
          <p className="mt-4 max-w-xl text-base text-muted">
            Customers book with clarity, providers respond with confidence, and admins keep the network healthy with live operations visibility.
          </p>
        </section>
        <section>
          <Outlet />
        </section>
      </Container>
    </div>
  );
}

export default AuthLayout;
