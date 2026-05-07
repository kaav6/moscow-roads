import { useQuery } from '@tanstack/react-query';
import type { DistrictDto } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from './http';

export function useDistricts() {
  return useQuery({
    queryKey: ['districts'],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.districts())
        : http.get('api/v1/districts').json<DistrictDto[]>(),
  });
}

export function useDistrictsRanking() {
  return useQuery({
    queryKey: ['districts', 'ranking'],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.districtsRanking())
        : http.get('api/v1/districts/ranking').json<DistrictDto[]>(),
  });
}
