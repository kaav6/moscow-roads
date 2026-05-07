import { useQuery } from '@tanstack/react-query';
import type { FeedEventDto } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from './http';

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.feed())
        : http.get('api/v1/feed?size=100').json<FeedEventDto[]>(),
  });
}
