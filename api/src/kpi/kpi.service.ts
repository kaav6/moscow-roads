import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeOfDay } from '@prisma/client';

const TOD_MAP: Record<TimeOfDay, 'day' | 'peak' | 'night'> = {
  DAY: 'day',
  PEAK: 'peak',
  NIGHT: 'night',
};

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async latest() {
    const [current, prev] = await this.prisma.kpiSnapshot.findMany({
      orderBy: { ts: 'desc' },
      take: 2,
    });
    if (!current) {
      const fallback = {
        ts: new Date().toISOString(),
        score: 5.0,
        activeIncidents: 0,
        avgSpeedKmh: 40,
        camerasOnline: 18,
        timeOfDay: 'day' as const,
        delta: { score: 0, activeIncidents: 0 },
      };
      return fallback;
    }
    return {
      ts: current.ts.toISOString(),
      score: current.score,
      activeIncidents: current.activeIncidents,
      avgSpeedKmh: current.avgSpeedKmh,
      camerasOnline: current.camerasOnline,
      timeOfDay: TOD_MAP[current.timeOfDay],
      delta: {
        score: prev ? Number((current.score - prev.score).toFixed(2)) : 0,
        activeIncidents: prev ? current.activeIncidents - prev.activeIncidents : 0,
      },
    };
  }

  async history(range: '15m' | '1h' | '6h' | '24h' = '1h', step: string = '5m') {
    const ms = range === '15m' ? 15 * 60_000 : range === '1h' ? 60 * 60_000 : range === '6h' ? 6 * 60 * 60_000 : 24 * 60 * 60_000;
    const since = new Date(Date.now() - ms);
    const stepMs = step === '1m' ? 60_000 : step === '5m' ? 5 * 60_000 : 15 * 60_000;
    const rows = await this.prisma.kpiSnapshot.findMany({
      where: { ts: { gte: since } },
      orderBy: { ts: 'asc' },
    });
    const buckets = new Map<number, { score: number; count: number }>();
    for (const r of rows) {
      const k = Math.floor(r.ts.getTime() / stepMs) * stepMs;
      const b = buckets.get(k) ?? { score: 0, count: 0 };
      b.score += r.score;
      b.count += 1;
      buckets.set(k, b);
    }
    const points = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([t, b]) => ({ ts: new Date(t).toISOString(), score: Number((b.score / b.count).toFixed(2)) }));
    return { range, step, points };
  }
}
