import type { QueryClient } from '@tanstack/react-query';
import type { RealtimeFrame, FeedEventDto } from '../types';

/** Базовый класс обработчика кадра реального времени. */
export abstract class FrameHandler {
  constructor(protected readonly qc: QueryClient) {}
  abstract apply(frame: RealtimeFrame): void;
}

class KpiHandler extends FrameHandler {
  apply(frame: RealtimeFrame): void {
    if (frame.type !== 'kpi.tick') return;
    this.qc.setQueryData(['kpi', 'latest'], frame.snapshot);
  }
}

class IncidentHandler extends FrameHandler {
  apply(frame: RealtimeFrame): void {
    this.qc.invalidateQueries({ queryKey: ['incidents'] });
    if (frame.type === 'incident.new' || frame.type === 'incident.update') {
      this.qc.setQueryData(['incident', frame.incident.id], frame.incident);
    }
  }
}

class FeedHandler extends FrameHandler {
  apply(frame: RealtimeFrame): void {
    if (frame.type !== 'feed.event') return;
    this.qc.setQueryData<FeedEventDto[]>(['feed'], old => {
      const next = old ? [frame.event, ...old] : [frame.event];
      return next.slice(0, 200);
    });
  }
}

class JamHandler extends FrameHandler {
  apply(_frame: RealtimeFrame): void {
    this.qc.invalidateQueries({ queryKey: ['districts'] });
  }
}

/** Полиморфно маршрутизирует кадр нужному обработчику по полю type. */
export class FrameDispatcher {
  private readonly handlers: Record<string, FrameHandler>;

  constructor(qc: QueryClient) {
    const incident = new IncidentHandler(qc);
    this.handlers = {
      'kpi.tick': new KpiHandler(qc),
      'incident.new': incident,
      'incident.update': incident,
      'incident.close': incident,
      'feed.event': new FeedHandler(qc),
      'jam.update': new JamHandler(qc),
    };
  }

  dispatch(frame: RealtimeFrame): void {
    this.handlers[frame.type]?.apply(frame);
  }
}
