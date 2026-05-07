import { useQuery } from '@tanstack/react-query';
import type { AnalyticsDashboardDto } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from './http';

export function useAnalyticsDashboard(range: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: ['analytics', range],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.analytics(range))
        : http.get(`api/v1/analytics/dashboard?range=${range}`).json<AnalyticsDashboardDto>(),
    staleTime: 15_000,
  });
}
