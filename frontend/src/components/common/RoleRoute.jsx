import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constant';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/permissions';
import { ProtectedRoute } from './ProtectedRoute';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {hasRole(user, allowedRoles) ? (
        children
      ) : (
        <Navigate
          to={ROUTES.unauthorized}
          replace
          state={{
            from: `${location.pathname}${location.search}`,
            reason: location.state?.reason || null,
          }}
        />
      )}
    </ProtectedRoute>
  );
}

export default RoleRoute;
