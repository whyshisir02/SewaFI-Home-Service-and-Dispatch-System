import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';

const chartGridColor = 'rgba(148, 163, 184, 0.22)';

const normalizeChartData = (data = []) =>
  data
    .filter((item) => item && (item.month || item.date || item.label))
    .map((item) => ({
      label: item.month || item.date || item.label,
      bookings: Number(item.bookings ?? item.count ?? item.total ?? 0),
      revenue: Number(item.revenue ?? 0),
    }));

export function BookingActivityChart({ data = [], isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton className="h-[340px] rounded-3xl" />;

  const chartData = normalizeChartData(data);

  return (
    <section className="rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[0_12px_30px_rgba(7,59,115,0.08)]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Analytics</p>
        <h2 className="mt-1 text-xl font-extrabold text-[var(--sf-text-main)] sm:text-2xl">Booking Activity</h2>
        <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Monthly booking trends across service requests.</p>
      </div>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load analytics.</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[var(--sf-secondary)]" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {!isError && !chartData.length ? (
        <div className="mt-4 flex h-[250px] items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-6 text-center text-sm text-[var(--sf-text-muted)]">
          Booking analytics will appear once data is available.
        </div>
      ) : null}

      {!isError && chartData.length ? (
        <div className="mt-4 h-[270px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid stroke={chartGridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--sf-surface)',
                  border: '1px solid var(--sf-border)',
                  borderRadius: '16px',
                  color: 'var(--sf-text-main)',
                }}
              />
              <Area type="monotone" dataKey="bookings" stroke="var(--sf-secondary)" fill="var(--sf-secondary-soft)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  );
}

export default BookingActivityChart;
