import { Container } from '../../../components/ui/Layout/Container';
import { NotificationsCenter } from '../../notification/pages/NotificationsCenter';

function ProviderNotifications() {
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <NotificationsCenter userRole="provider" />
    </Container>
  );
}

export default ProviderNotifications;

