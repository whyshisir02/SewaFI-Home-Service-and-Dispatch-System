import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';

export function ProviderEarningsChart({ summary }) {
  const data = [
    { label: 'Today', amount: summary?.earnings?.today?.amount || 0 },
    { label: '7 days', amount: summary?.earnings?.last7days?.amount || 0 },
    { label: 'Month', amount: summary?.earnings?.thisMonth?.amount || 0 },
    { label: 'Year', amount: summary?.earnings?.thisYear?.amount || 0 },
  ];

  return (
    <ChartCard title="Earnings summary" description="A compact snapshot of provider revenue over key windows.">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="amount" stroke="rgb(var(--color-primary))" fill="rgb(var(--color-primary) / 0.18)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default ProviderEarningsChart;
