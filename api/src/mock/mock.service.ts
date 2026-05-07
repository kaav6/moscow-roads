import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { FeedTag, IncidentStatus, TimeOfDay } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';

const FEED_PROBES = [
  { tag: FeedTag.SENSOR, fn: (i: number) => `Снижение скорости на участке: ${20 + (i % 15)} км/ч` },
  { tag: FeedTag.WEATHER, fn: (i: number) => `Метеосенсор: T° ${-3 + (i % 8)}, влажность ${60 + (i % 30)}%` },
  { tag: FeedTag.CAMERA, fn: (_: number) => `Камера КП-${184 + Math.floor(Math.random() * 20)} активна` },
  { tag: FeedTag.STATUS, fn: (_: number) => `Регламентное перекрытие: коридор обновлён` },
  { tag: FeedTag.EVENT, fn: (_: number) => `Обновлены метки на карте` },
];

@Injectable()
export class MockService {
  private readonly enabled: boolean;
  private tickCounter = 0;

  constructor(
    private readonly cfg: ConfigService,
    private readonly prisma: PrismaService,
    private readonly feed: FeedService,
    private readonly events: EventEmitter2,
  ) {
    this.enabled =
      this.cfg.get<boolean>('MOSCOW_ROADS_MOCK_ENABLED') === true ||
      this.cfg.get<string>('MOSCOW_ROADS_MOCK_ENABLED') === 'true';
  }

  @Interval('kpi-tick', 5_000)
  async tickFast() {
    if (!this.enabled) return;
    this.tickCounter += 1;
    const hour = new Date().getHours();
    const tod: TimeOfDay = hour >= 7 && hour < 10 ? TimeOfDay.PEAK : hour >= 17 && hour < 21 ? TimeOfDay.PEAK : hour >= 22 || hour < 6 ? TimeOfDay.NIGHT : TimeOfDay.DAY;
    const baseline = tod === TimeOfDay.PEAK ? 7.5 : tod === TimeOfDay.NIGHT ? 2.5 : 4.5;
    const active = await this.prisma.incident.count({ where: { status: IncidentStatus.ACTIVE } });
    const score = Number((baseline + Math.sin(this.tickCounter / 12) * 1.2 + Math.random() * 0.6).toFixed(2));
    const avgSpeedKmh = Number((45 - score * 1.8 + Math.random() * 2).toFixed(1));
    const camerasOnline = await this.prisma.camera.count({ where: { online: true } });

    const prev = await this.prisma.kpiSnapshot.findFirst({ orderBy: { ts: 'desc' } });
    const created = await this.prisma.kpiSnapshot.create({
      data: { score, activeIncidents: active, avgSpeedKmh, camerasOnline, timeOfDay: tod },
    });
    const snapshot = {
      ts: created.ts.toISOString(),
      score,
      activeIncidents: active,
      avgSpeedKmh,
      camerasOnline,
      timeOfDay: tod.toLowerCase(),
      delta: {
        score: prev ? Number((score - prev.score).toFixed(2)) : 0,
        activeIncidents: prev ? active - prev.activeIncidents : 0,
      },
    };
    this.events.emit('kpi.tick', { snapshot });
  }

  @Interval('feed-tick', 6_000)
  async tickMedium() {
    if (!this.enabled) return;
    const probe = FEED_PROBES[this.tickCounter % FEED_PROBES.length];
    const created = await this.prisma.feedEvent.create({
      data: { tag: probe.tag, message: probe.fn(this.tickCounter) },
    });
    this.events.emit('feed.event', { event: this.feed.serialize(created) });
  }

  @Interval('jam-tick', 30_000)
  async tickSlow() {
    if (!this.enabled) return;
    const districts = await this.prisma.district.findMany();
    for (const d of districts) {
      if (Math.random() < 0.5) {
        const score = Math.max(1, Math.min(10, d.score + (Math.random() - 0.5) * 0.6));
        await this.prisma.district.update({ where: { code: d.code }, data: { score: Number(score.toFixed(2)) } });
        await this.prisma.jamSegment.create({ data: { districtCode: d.code, avgScore: score } });
        this.events.emit('jam.update', { districtCode: d.code, score: Number(score.toFixed(2)) });
      }
    }
  }
}
