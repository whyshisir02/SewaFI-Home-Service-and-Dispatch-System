import { RoleRoute } from '../components/common/RoleRoute';

export const withRoleGuard = (element, allowedRoles) => (
  <RoleRoute allowedRoles={allowedRoles}>{element}</RoleRoute>
);
