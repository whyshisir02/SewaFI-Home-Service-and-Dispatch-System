import { Container } from '../../../components/ui/Layout/Container';
import { NotificationsCenter } from '../../notification/pages/NotificationsCenter';

function CustomerNotifications() {
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <NotificationsCenter userRole="customer" />
    </Container>
  );
}

export default CustomerNotifications;

