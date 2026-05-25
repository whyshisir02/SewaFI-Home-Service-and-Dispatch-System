import { Suspense, createElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from '../components/common/NotFound';
import { AppErrorBoundary } from '../components/errors/AppErrorBoundary';
import { RoleRoute } from '../components/common/RoleRoute';
import { Spinner } from '../components/ui/Feedback/Spinner';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { ProviderLayout } from '../components/layout/ProviderLayout';
import { PublicLayout } from '../components/layout/PublicLayout';
import { ROLES } from '../constants/roles.constant';
import { ROUTES } from '../constants/routes.constant';
import { useAuth } from '../context/AuthContext';
import {
  adminRoutes,
  authRoutes,
  customerRoutes,
  providerRoutes,
  publicRoutes,
} from './routes';

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Spinner size="lg" />
  </div>
);

const renderRoutes = (items) =>
  items.map(({ path, component }) => <Route key={path} path={path} element={createElement(component)} />);

const providerStatus = (user) =>
  String(user?.providerProfile?.status || user?.providerStatus || '').toUpperCase();

const isProviderApproved = (user) => providerStatus(user) === 'APPROVED';

function DashboardRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (user?.role === ROLES.CUSTOMER) return <Navigate to={ROUTES.customer.dashboard} replace />;
  if (user?.role === ROLES.PROVIDER) {
    return <Navigate to={isProviderApproved(user) ? ROUTES.provider.dashboard : ROUTES.provider.verification} replace />;
  }
  if (user?.role === ROLES.ADMIN) return <Navigate to={ROUTES.admin.dashboard} replace />;
  return <Navigate to={ROUTES.home} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path={ROUTES.dashboard} element={<DashboardRedirect />} />
            <Route path={ROUTES.auth} element={<Navigate to={ROUTES.login} replace />} />

            <Route
              path={ROUTES.customer.root}
              element={
                <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                  <Navigate to={ROUTES.customer.dashboard} replace />
                </RoleRoute>
              }
            />

            <Route
              path={ROUTES.provider.root}
              element={
                <RoleRoute allowedRoles={[ROLES.PROVIDER]}>
                  <DashboardRedirect />
                </RoleRoute>
              }
            />

            <Route
              path={ROUTES.admin.root}
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <Navigate to={ROUTES.admin.dashboard} replace />
                </RoleRoute>
              }
            />

            <Route element={<PublicLayout />}>{renderRoutes(publicRoutes)}</Route>
            <Route element={<AuthLayout />}>{renderRoutes(authRoutes)}</Route>

            <Route
              element={
                <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                  <CustomerLayout />
                </RoleRoute>
              }
            >
              {renderRoutes(customerRoutes.items)}
            </Route>

            <Route
              element={
                <RoleRoute allowedRoles={[ROLES.PROVIDER]}>
                  <ProviderLayout />
                </RoleRoute>
              }
            >
              {renderRoutes(providerRoutes.items)}
            </Route>

            <Route
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <AdminLayout />
                </RoleRoute>
              }
            >
              {renderRoutes(adminRoutes.items)}
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
