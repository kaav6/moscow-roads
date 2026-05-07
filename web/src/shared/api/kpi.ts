import { useQuery } from '@tanstack/react-query';
import type { KpiDto } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from './http';

export function useKpiLatest() {
  return useQuery({
    queryKey: ['kpi', 'latest'],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.kpi())
        : http.get('api/v1/kpi').json<KpiDto>(),
    refetchInterval: DEMO_MODE ? false : 30_000,
  });
}
