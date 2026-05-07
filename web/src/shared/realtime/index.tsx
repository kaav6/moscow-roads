import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeFrame, FeedEventDto } from '../types';
import { DEMO_MODE } from '../demo';
import { useAuth, getToken } from '@/shared/auth';

export function RealtimeBridge() {
  const qc = useQueryClient();
  const { token, status } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (status !== 'authenticated') return;
    const tk = token ?? getToken();
    if (!tk) return;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${scheme}://${location.host}/ws?token=${encodeURIComponent(tk)}`;
    let stopped = false;
    let backoff = 1000;

    const connect = () => {
      if (stopped) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        backoff = 1000;
      };
      ws.onmessage = ev => {
        let frame: RealtimeFrame;
        try { frame = JSON.parse(ev.data); } catch { return; }
        switch (frame.type) {
          case 'kpi.tick':
            qc.setQueryData(['kpi', 'latest'], frame.snapshot);
            break;
          case 'incident.new':
          case 'incident.update':
            qc.invalidateQueries({ queryKey: ['incidents'] });
            qc.setQueryData(['incident', frame.incident.id], frame.incident);
            break;
          case 'incident.close':
            qc.invalidateQueries({ queryKey: ['incidents'] });
            break;
          case 'feed.event':
            qc.setQueryData<FeedEventDto[]>(['feed'], old => {
              const next = old ? [frame.event, ...old] : [frame.event];
              return next.slice(0, 200);
            });
            break;
          case 'jam.update':
            qc.invalidateQueries({ queryKey: ['districts'] });
            break;
        }
      };
      ws.onclose = () => {
        if (stopped) return;
        const delay = Math.min(backoff, 30_000);
        backoff = Math.min(backoff * 1.6, 30_000);
        setTimeout(connect, delay + Math.random() * 500);
      };
      ws.onerror = () => {
        try { ws.close(); } catch { /* ignore */ }
      };
    };

    connect();
    return () => {
      stopped = true;
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
      }
    };
  }, [status, token, qc]);

  return null;
}
