import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

export const useProviderEarnings = (filters = {}) => {
  const earningsQuery = useQuery({
    queryKey: ['provider-earnings', filters],
    queryFn: () => providerApi.stats(filters),
  });

  const payload = earningsQuery.data || {};
  const summary = payload.summary || {};
  const earningsRows = useMemo(
    () =>
      Array.isArray(payload.transactions)
        ? payload.transactions
        : Array.isArray(payload.earnings)
          ? payload.earnings
          : [],
    [payload.transactions, payload.earnings]
  );
  const meta = payload.meta || null;

  const derivedSeries = useMemo(() => {
    const bucket = new Map();
    earningsRows.forEach((row) => {
      if (!row?.paidAt || row?.providerEarningAmount == null) return;
      const key = new Date(row.paidAt).toLocaleDateString();
      const current = bucket.get(key) || { date: key, earnings: 0, jobs: 0 };
      current.earnings += Number(row.providerEarningAmount || 0);
      current.jobs += 1;
      bucket.set(key, current);
    });
    return Array.from(bucket.values());
  }, [earningsRows]);

  const metrics = payload.earningsSummary || payload.earnings || {};

  const earningsSummary = {
    today: metrics.today || { amount: 0, count: 0 },
    last7days: metrics.last7days || { amount: 0, count: 0 },
    thisMonth: metrics.thisMonth || { amount: 0, count: 0 },
    total: metrics.total || {
      amount: Number(summary.totalNetEarnings || 0),
      count: Number(summary.completedPaidJobs || 0),
    },
    series: derivedSeries,
  };

  return {
    earningsQuery,
    summary,
    earnings: earningsRows,
    meta,
    earningsSummary,
    providerProfile: payload.profile || null,
  };
};
