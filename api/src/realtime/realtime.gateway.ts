import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import { WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  private readonly logger = new Logger('RealtimeGateway');
  private readonly sessions = new Set<WebSocket>();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(
    private readonly jwt: JwtService,
    private readonly events: EventEmitter2,
  ) {}

  afterInit() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcast({ type: 'heartbeat', serverTime: new Date().toISOString() });
    }, 30_000);
    this.logger.log('WebSocket gateway online at /ws');
  }

  handleConnection(client: WebSocket, req: IncomingMessage) {
    const token = this.extractToken(req);
    if (!token) {
      client.close(4401, 'no token');
      return;
    }
    try {
      this.jwt.verify(token);
    } catch {
      client.close(4401, 'invalid token');
      return;
    }
    this.sessions.add(client);
    client.send(
      JSON.stringify({
        type: 'welcome',
        sessionId: randomUUID(),
        serverTime: new Date().toISOString(),
      }),
    );
  }

  handleDisconnect(client: WebSocket) {
    this.sessions.delete(client);
  }

  async onApplicationShutdown() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.broadcast({ type: 'shutdown' });
    for (const c of this.sessions) {
      try { c.close(1001, 'shutdown'); } catch { /* ignore */ }
    }
    this.sessions.clear();
  }

  @OnEvent('kpi.tick')
  onKpiTick(payload: { snapshot: any }) {
    this.broadcast({ type: 'kpi.tick', snapshot: payload.snapshot });
  }

  @OnEvent('incident.new')
  onIncidentNew(payload: { incident: any }) {
    this.broadcast({ type: 'incident.new', incident: payload.incident });
  }

  @OnEvent('incident.update')
  onIncidentUpdate(payload: { incident: any }) {
    this.broadcast({ type: 'incident.update', incident: payload.incident });
  }

  @OnEvent('incident.close')
  onIncidentClose(payload: { incidentId: string }) {
    this.broadcast({ type: 'incident.close', incidentId: payload.incidentId });
  }

  @OnEvent('feed.event')
  onFeedEvent(payload: { event: any }) {
    this.broadcast({ type: 'feed.event', event: payload.event });
  }

  @OnEvent('jam.update')
  onJamUpdate(payload: { districtCode: string; score: number }) {
    this.broadcast({ type: 'jam.update', districtCode: payload.districtCode, score: payload.score });
  }

  private extractToken(req: IncomingMessage): string | null {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  }

  private broadcast(frame: object) {
    const payload = JSON.stringify(frame);
    for (const c of this.sessions) {
      if (c.readyState === c.OPEN) {
        try { c.send(payload); } catch { /* ignore */ }
      }
    }
  }
}
