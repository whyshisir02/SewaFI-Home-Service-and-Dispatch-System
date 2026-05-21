import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '../ui/Feedback/Skeleton';

const colors = ['var(--sf-secondary)', 'var(--sf-primary)', '#16A34A', 'var(--sf-accent)', '#38BDF8', '#84CC16'];

const normalizeDistribution = (data = []) =>
  data
    .map((item) => ({
      id: item.id || item.name,
      name: item.name || item.category || item.label,
      value: Number(item.totalBookings ?? item.count ?? item.value ?? 0),
    }))
    .filter((item) => item.name && item.value > 0);

export function ServiceDistributionChart({ data = [], isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton className="h-[380px] rounded-[28px]" />;

  const chartData = normalizeDistribution(data);

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Demand mix</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Service Category Distribution</h2>
        <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Completed bookings grouped by backend service categories.</p>
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
        <div className="mt-5 flex h-[280px] items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-6 text-center text-sm text-[var(--sf-text-muted)]">
          Service distribution data is not available yet.
        </div>
      ) : null}

      {!isError && chartData.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.id} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--sf-surface)',
                    border: '1px solid var(--sf-border)',
                    borderRadius: '16px',
                    color: 'var(--sf-text-main)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {chartData.slice(0, 6).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3">
                <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[var(--sf-text-main)]">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="text-sm font-bold text-[var(--sf-text-muted)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ServiceDistributionChart;
