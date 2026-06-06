import type { RealtimeFrame } from '../types';

/**
 * Инкапсулирует WebSocket-соединение: владеет сокетом, счётчиком
 * экспоненциальной задержки и флагом остановки, наружу отдаёт connect/disconnect.
 */
export class RealtimeClient {
  private socket: WebSocket | null = null;
  private backoff = 1000;
  private stopped = false;

  constructor(
    private readonly url: string,
    private readonly onFrame: (frame: RealtimeFrame) => void,
  ) {}

  connect(): void {
    if (this.stopped) return;
    const ws = new WebSocket(this.url);
    this.socket = ws;
    ws.onopen = () => { this.backoff = 1000; };
    ws.onmessage = ev => {
      let frame: RealtimeFrame;
      try { frame = JSON.parse(ev.data); } catch { return; }
      this.onFrame(frame);
    };
    ws.onclose = () => this.scheduleReconnect();
    ws.onerror = () => { try { ws.close(); } catch { /* ignore */ } };
  }

  disconnect(): void {
    this.stopped = true;
    if (this.socket) { try { this.socket.close(); } catch { /* ignore */ } }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    const delay = Math.min(this.backoff, 30_000) + Math.random() * 500;
    this.backoff = Math.min(this.backoff * 1.6, 30_000);
    setTimeout(() => this.connect(), delay);
  }
}
