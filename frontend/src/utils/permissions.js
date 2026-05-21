import { ROLES } from '../constants/roles.constant';

export const hasRole = (user, allowedRoles = []) =>
  Boolean(user?.role && allowedRoles.includes(user.role));

export const isDashboardRole = (role) =>
  [ROLES.CUSTOMER, ROLES.PROVIDER, ROLES.ADMIN].includes(role);
