import { Container } from '../../../components/ui/Layout/Container';
import { NotificationsCenter } from '../../notification/pages/NotificationsCenter';

function AdminNotifications() {
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <NotificationsCenter userRole="admin" />
    </Container>
  );
}

export default AdminNotifications;
