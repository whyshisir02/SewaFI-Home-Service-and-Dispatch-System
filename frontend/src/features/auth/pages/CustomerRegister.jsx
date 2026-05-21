import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constant';

function CustomerRegister() {
  return <Navigate to={ROUTES.register} replace />;
}

export default CustomerRegister;
