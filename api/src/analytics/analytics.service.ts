import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentStatus } from '@prisma/client';

const COLOR_BY_TYPE: Record<string, string> = {
  ACCIDENT: '#DC2626',
  WORKS: '#F59E0B',
  CLOSURE: '#7C3AED',
  CAMERA: '#2563EB',
  WEATHER: '#0E9A95',
};

const TYPE_LABEL: Record<string, string> = {
  ACCIDENT: 'ДТП',
  WORKS: 'Работы',
  CLOSURE: 'Перекрытие',
  CAMERA: 'Камера',
  WEATHER: 'Погода',
};

const SOURCE_COLOR: Record<string, string> = {
  'Камера': '#1A4FBA',
  'Звонок 112': '#0E9A95',
  'АСУДД': '#F59E0B',
  'Метеосенсор': '#7C3AED',
  'Патруль': '#DC2626',
  'ЦОДД-плановое': '#5B6573',
  'Регламент': '#3B82F6',
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(range: 'today' | 'week' | 'month' = 'today') {
    const ms = range === 'today' ? 86_400_000 : range === 'week' ? 7 * 86_400_000 : 30 * 86_400_000;
    const since = new Date(Date.now() - ms);
    const step = range === 'today' ? 5 * 60_000 : range === 'week' ? 60 * 60_000 : 6 * 60 * 60_000;

    const [kpi, prevKpi, incidents, byTypeRows, byDistrict, kpiSnapshot] = await Promise.all([
      this.prisma.kpiSnapshot.findMany({ where: { ts: { gte: since } }, orderBy: { ts: 'asc' } }),
      this.prisma.kpiSnapshot.findMany({ where: { ts: { gte: new Date(since.getTime() - ms), lt: since } }, orderBy: { ts: 'asc' } }),
      this.prisma.incident.findMany({ where: { reportedAt: { gte: since } }, select: { reportedAt: true, source: true } }),
      this.prisma.incident.groupBy({ by: ['type'], where: { reportedAt: { gte: since } }, _count: { _all: true } }),
      this.prisma.district.findMany({ orderBy: { score: 'desc' } }),
      this.prisma.kpiSnapshot.findMany({ where: { ts: { gte: new Date(Date.now() - 7 * 86_400_000) } }, orderBy: { ts: 'asc' } }),
    ]);

    const jamHistory = {
      points: this.bucketise(kpi, step),
      compareToPreviousWeek: { points: this.bucketise(prevKpi, step) },
    };

    const incidentsByHour: number[] = Array(24).fill(0);
    for (const inc of incidents) {
      incidentsByHour[inc.reportedAt.getHours()] += 1;
    }

    const totalByType = byTypeRows.reduce((s, r) => s + r._count._all, 0);
    const byType = byTypeRows.map(r => ({
      type: TYPE_LABEL[r.type] ?? r.type,
      value: totalByType ? Math.round((r._count._all / totalByType) * 100) : 0,
      color: COLOR_BY_TYPE[r.type] ?? '#5B6573',
    }));

    const sourceCounts = new Map<string, number>();
    for (const inc of incidents) {
      const k = (inc.source ?? 'Прочее').split(' ')[0] || 'Прочее';
      sourceCounts.set(k, (sourceCounts.get(k) ?? 0) + 1);
    }
    const totalSrc = Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0) || 1;
    const sources = Array.from(sourceCounts.entries())
      .map(([label, n]) => ({ label, value: Math.round((n / totalSrc) * 100), color: SOURCE_COLOR[label] ?? '#5B6573' }))
      .slice(0, 6);

    const trend = kpiSnapshot.slice(-24).map(k => Number((k.avgSpeedKmh).toFixed(1)));

    const weeklyHeatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const inc of incidents) {
      const day = (inc.reportedAt.getDay() + 6) % 7;
      const hr = inc.reportedAt.getHours();
      weeklyHeatmap[day][hr] += 1;
    }

    const resolved = await this.prisma.incident.findMany({
      where: { status: IncidentStatus.RESOLVED, resolvedAt: { gte: since } },
      select: { reportedAt: true, acknowledgedAt: true, resolvedAt: true },
    });
    const reaction = this.computeReaction(resolved);

    return {
      range,
      jamHistory,
      incidentsByHour,
      byType,
      byDistrict: byDistrict.map(d => ({ code: d.code, name: d.name, score: d.score })),
      reactionTime: { ...reaction, trend },
      sources,
      weeklyHeatmap,
    };
  }

  private bucketise(rows: { ts: Date; score: number }[], stepMs: number) {
    const buckets = new Map<number, { sum: number; count: number }>();
    for (const r of rows) {
      const k = Math.floor(r.ts.getTime() / stepMs) * stepMs;
      const b = buckets.get(k) ?? { sum: 0, count: 0 };
      b.sum += r.score;
      b.count += 1;
      buckets.set(k, b);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([t, b]) => ({ t: new Date(t).toISOString(), v: Number((b.sum / b.count).toFixed(2)) }));
  }

  private computeReaction(resolved: { reportedAt: Date; acknowledgedAt: Date | null; resolvedAt: Date | null }[]) {
    if (!resolved.length) {
      return { detectionSec: 45, arrivalSec: 360, resolutionSec: 1800 };
    }
    const acks = resolved.filter(r => r.acknowledgedAt).map(r => (r.acknowledgedAt!.getTime() - r.reportedAt.getTime()) / 1000);
    const res = resolved.filter(r => r.resolvedAt).map(r => (r.resolvedAt!.getTime() - r.reportedAt.getTime()) / 1000);
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
    return { detectionSec: 45, arrivalSec: avg(acks) || 360, resolutionSec: avg(res) || 1800 };
  }
}
