import { Container } from '../../../components/ui/Layout/Container';
import MaintenanceHero from '../../../components/errors/MaintenanceHero';
import MaintenanceInfoCards from '../../../components/errors/MaintenanceInfoCards';
import MaintenanceStatusPanel from '../../../components/errors/MaintenanceStatusPanel';
import { useSystemStatus } from '../../../hooks/useSystemStatus';

function MaintenancePage() {
  const statusQuery = useSystemStatus();
  const rawStatus = statusQuery.data;
  const maintenanceFlag = rawStatus?.maintenance;
  const isMaintenance = typeof maintenanceFlag === 'boolean' ? maintenanceFlag : null;

  const statusData = isMaintenance === true ? rawStatus : null;
  const statusMessage =
    statusData?.message
    || (isMaintenance === false ? 'Maintenance appears to be finished.' : '');

  return (
    <main className="min-h-screen bg-[var(--sf-bg)] px-4 py-16">
      <Container className="max-w-5xl space-y-6">
        <MaintenanceHero
          message={statusMessage}
          onRetry={() => window.location.reload()}
          showContact
        />

        <MaintenanceStatusPanel
          statusData={statusData}
          loading={statusQuery.isLoading}
        />

        <MaintenanceInfoCards />

        {/* TODO: Enable maintenance mode when backend status/maintenance API is available. */}
      </Container>
    </main>
  );
}

export default MaintenancePage;
