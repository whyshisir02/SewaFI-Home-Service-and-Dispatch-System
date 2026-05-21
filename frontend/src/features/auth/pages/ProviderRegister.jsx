import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constant';

function ProviderRegister() {
  return <Navigate to={`${ROUTES.register}?role=provider`} replace />;
}

export default ProviderRegister;
