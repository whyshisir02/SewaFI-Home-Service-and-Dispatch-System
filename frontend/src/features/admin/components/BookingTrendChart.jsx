import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';

export function BookingTrendChart({ data = [] }) {
  const chartData = Array.isArray(data) && data.length ? data : [{ label: 'Open', total: 0 }];
  return (
    <ChartCard title="Booking trend" description="Status distribution and current booking movement.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="rgb(var(--color-secondary))" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default BookingTrendChart;
