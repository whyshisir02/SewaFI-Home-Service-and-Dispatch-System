import { Container } from '../../../components/ui/Layout/Container';
import { ProfileSettingsView } from '../../profile/components/ProfileSettingsView';

function ProviderProfile() {
  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <ProfileSettingsView roleKey="provider" />
    </Container>
  );
}

export default ProviderProfile;
