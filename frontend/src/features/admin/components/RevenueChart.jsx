import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';

export function RevenueChart({ data = [] }) {
  const chartData = Array.isArray(data) && data.length ? data : [{ label: 'Current', revenue: 0 }];
  return (
    <ChartCard title="Revenue trend" description="Revenue performance across the reporting window.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="rgb(var(--color-primary))" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default RevenueChart;
