import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes.constant';
import { Avatar } from '../ui/DataDisplay/Avatar';
import { Dropdown } from '../ui/Overlay/Dropdown';

const dashboardRouteByRole = {
  CUSTOMER: ROUTES.customer.dashboard,
  PROVIDER: ROUTES.provider.dashboard,
  ADMIN: ROUTES.admin.dashboard,
};

const profileRouteByRole = {
  CUSTOMER: ROUTES.customer.profile,
  PROVIDER: ROUTES.provider.profile,
  ADMIN: ROUTES.admin.settings,
};

const notificationsRouteByRole = {
  CUSTOMER: ROUTES.customer.notifications,
  PROVIDER: ROUTES.provider.notifications,
  ADMIN: ROUTES.admin.notifications,
};

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const dashboardPath = dashboardRouteByRole[user.role] || ROUTES.home;
  const profilePath = profileRouteByRole[user.role] || ROUTES.home;
  const notificationsPath = notificationsRouteByRole[user.role] || ROUTES.home;

  return (
    <Dropdown
      trigger={<Avatar src={user.avatar} alt={user.name} fallback={user.name?.slice(0, 2) || 'SF'} />}
      items={[
        {
          label: `Dashboard (${user.role})`,
          onClick: () => navigate(dashboardPath),
        },
        {
          label: 'Profile',
          onClick: () => navigate(profilePath),
        },
        { label: 'Notifications', onClick: () => navigate(notificationsPath) },
        { label: 'Sign out', onClick: () => void logout() },
      ]}
    />
  );
}

export default ProfileDropdown;
