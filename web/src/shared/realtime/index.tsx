import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DEMO_MODE } from '../demo';
import { useAuth, getToken } from '@/shared/auth';
import { RealtimeClient } from './RealtimeClient';
import { FrameDispatcher } from './FrameDispatcher';

/**
 * Тонкий компонент-мост: живёт в дереве React, а всю инфраструктурную
 * работу делегирует объектам RealtimeClient и FrameDispatcher.
 */
export function RealtimeBridge() {
  const qc = useQueryClient();
  const { token, status } = useAuth();

  useEffect(() => {
    if (DEMO_MODE) return;
    if (status !== 'authenticated') return;
    const tk = token ?? getToken();
    if (!tk) return;

    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${scheme}://${location.host}/ws?token=${encodeURIComponent(tk)}`;

    const dispatcher = new FrameDispatcher(qc);
    const client = new RealtimeClient(url, frame => dispatcher.dispatch(frame));
    client.connect();
    return () => client.disconnect();
  }, [status, token, qc]);

  return null;
}
