import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncidentDto } from '../types';
import { DEMO_MODE, demo } from '../demo';
import { http } from './http';

export interface IncidentListResponse {
  items: IncidentDto[];
  total: number;
  page: number;
  size: number;
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.incidents())
        : http.get('api/v1/incidents?size=200').json<IncidentListResponse>(),
  });
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: ['incident', id],
    enabled: !!id,
    queryFn: () =>
      DEMO_MODE
        ? Promise.resolve(demo.incident(id!))
        : http.get(`api/v1/incidents/${id}`).json<IncidentDto>(),
  });
}

async function postAction(id: string, action: string, comment?: string): Promise<void> {
  if (DEMO_MODE) return;
  await http.post(`api/v1/incidents/${id}/${action}`, { json: { comment } });
}

export function useEscalate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      postAction(id, 'escalate', comment),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incident', vars.id] });
    },
  });
}

export function useAcknowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      postAction(id, 'acknowledge', comment),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incident', vars.id] });
    },
  });
}

export function useResolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      postAction(id, 'resolve', comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
