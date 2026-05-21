import { Card } from '../../../components/ui/Layout/Card';

export function AdminActivityFeed() {
  return (
    <Card className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Live activity</h3>
      <div className="space-y-3">
        {[
          'No recent live activity yet.',
          'New booking, provider, and review events will appear here as they happen.',
          'Refresh the dashboard to load the latest system events.',
        ].map((item) => (
          <div key={item} className="rounded-2xl bg-surface-muted p-3 text-sm text-muted">
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default AdminActivityFeed;
