import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';

const colors = ['rgb(var(--color-primary))', 'rgb(var(--color-secondary))', '#f59e0b', '#ef4444'];

export function CategoryAnalyticsChart({ data = [] }) {
  const chartData = Array.isArray(data) && data.length ? data : [{ label: 'Unassigned', value: 1 }];

  return (
    <ChartCard title="Category analytics" description="Category-wise booking distribution and service demand.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="label" outerRadius={90}>
            {chartData.map((entry, index) => (
              <Cell key={entry.label} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default CategoryAnalyticsChart;
