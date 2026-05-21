import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../ui/Feedback/Spinner';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(nextPath)}`} state={{ from: nextPath }} replace />;
  }

  return children;
}

export default ProtectedRoute;
