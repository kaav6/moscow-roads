import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IncidentEventKind,
  IncidentStatus,
  Prisma,
  ResponderStatus,
  FeedTag,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentFilterDto } from './dto/incident-filter.dto';

const incidentInclude = {
  district: true,
  responders: { include: { responder: true } },
  feedEvents: { take: 1 },
  events: { orderBy: { at: 'desc' as const }, take: 50, include: { actor: { select: { id: true, fullName: true } } } },
} satisfies Prisma.IncidentInclude;

type FullIncident = Prisma.IncidentGetPayload<{ include: typeof incidentInclude }>;

const TYPE_MAP: Record<string, string> = {
  ACCIDENT: 'accident', WORKS: 'works', CLOSURE: 'closure', CAMERA: 'camera', WEATHER: 'weather',
};
const PRIO_MAP: Record<string, string> = { HIGH: 'high', MED: 'med', LOW: 'low' };
const STATUS_MAP: Record<string, string> = { ACTIVE: 'active', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved' };
const RESP_KIND_MAP: Record<string, string> = { DPS: 'dps', AMBULANCE: 'ambulance', TOW: 'tow', INSPECTOR: 'inspector' };
const RESP_STATUS_MAP: Record<string, string> = { ACTIVE: 'active', EN_ROUTE: 'en_route', IDLE: 'idle' };
const EVENT_KIND_MAP: Record<string, string> = {
  CREATED: 'created', VERIFIED: 'verified', DISPATCHED: 'dispatched',
  ESCALATED: 'escalated', ACTION: 'action', RESOLVED: 'resolved', COMMENT: 'comment',
};

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async list(filter: IncidentFilterDto) {
    const where: Prisma.IncidentWhereInput = {};
    if (filter.type?.length) where.type = { in: filter.type.map(s => s.toUpperCase()) as any };
    if (filter.priority?.length) where.priority = { in: filter.priority.map(s => s.toUpperCase()) as any };
    if (filter.status?.length) where.status = { in: filter.status.map(s => s.toUpperCase()) as any };
    else where.status = IncidentStatus.ACTIVE;
    if (filter.districtCode) where.districtCode = filter.districtCode;
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { address: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    const page = filter.page ?? 0;
    const size = Math.min(filter.size ?? 50, 200);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.incident.count({ where }),
      this.prisma.incident.findMany({
        where,
        include: incidentInclude,
        orderBy: { reportedAt: 'desc' },
        skip: page * size,
        take: size,
      }),
    ]);
    return { items: items.map(i => this.serialize(i, false)), total, page, size };
  }

  async detail(id: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: incidentInclude });
    if (!incident) throw new NotFoundException('incident not found');
    return this.serialize(incident, true);
  }

  async timeline(id: string) {
    const events = await this.prisma.incidentEvent.findMany({
      where: { incidentId: id },
      include: { actor: { select: { id: true, fullName: true } } },
      orderBy: { at: 'desc' },
    });
    return events.map(e => ({
      id: e.id,
      kind: EVENT_KIND_MAP[e.kind],
      at: e.at.toISOString(),
      comment: e.comment,
      actor: e.actor ? { id: e.actor.id, fullName: e.actor.fullName } : null,
    }));
  }

  async escalate(id: string, actorId: string, comment?: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incident not found');
    if (inc.status === IncidentStatus.RESOLVED)
      throw new ConflictException('cannot escalate a resolved incident');
    const updated = await this.prisma.$transaction(async tx => {
      await tx.incidentEvent.create({
        data: { incidentId: id, kind: IncidentEventKind.ESCALATED, actorId, comment },
      });
      await tx.incident.update({ where: { id }, data: { priority: 'HIGH' } });
      await tx.feedEvent.create({
        data: { tag: FeedTag.EVENT, incidentId: id, message: `Эскалация ${id}` },
      });
      return tx.incident.findUniqueOrThrow({ where: { id }, include: incidentInclude });
    });
    this.events.emit('incident.update', { incident: this.serialize(updated, true) });
  }

  async acknowledge(id: string, actorId: string, comment?: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incident not found');
    if (inc.status === IncidentStatus.RESOLVED)
      throw new ConflictException('already resolved');
    const updated = await this.prisma.$transaction(async tx => {
      await tx.incident.update({
        where: { id },
        data: { status: IncidentStatus.IN_PROGRESS, acknowledgedAt: new Date(), acknowledgedBy: actorId },
      });
      await tx.incidentEvent.create({
        data: { incidentId: id, kind: IncidentEventKind.ACTION, actorId, comment },
      });
      return tx.incident.findUniqueOrThrow({ where: { id }, include: incidentInclude });
    });
    this.events.emit('incident.update', { incident: this.serialize(updated, true) });
  }

  async resolve(id: string, actorId: string, comment?: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incident not found');
    if (inc.status === IncidentStatus.RESOLVED)
      throw new ConflictException('already resolved');
    await this.prisma.$transaction(async tx => {
      await tx.incident.update({
        where: { id },
        data: { status: IncidentStatus.RESOLVED, resolvedAt: new Date(), resolvedBy: actorId },
      });
      await tx.incidentEvent.create({
        data: { incidentId: id, kind: IncidentEventKind.RESOLVED, actorId, comment },
      });
      await tx.feedEvent.create({
        data: { tag: FeedTag.STATUS, incidentId: id, message: `Закрыт ${id}` },
      });
    });
    this.events.emit('incident.close', { incidentId: id });
  }

  async assignResponder(id: string, responderCode: string, eta?: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incident not found');
    await this.prisma.incidentResponder.upsert({
      where: { incidentId_responderCode: { incidentId: id, responderCode } },
      update: { status: ResponderStatus.EN_ROUTE, eta: eta ?? '8 мин' },
      create: { incidentId: id, responderCode, status: ResponderStatus.EN_ROUTE, eta: eta ?? '8 мин' },
    });
    await this.prisma.incidentEvent.create({
      data: { incidentId: id, kind: IncidentEventKind.DISPATCHED, comment: `Назначен ${responderCode}` },
    });
    await this.prisma.feedEvent.create({
      data: { tag: FeedTag.DISPATCH, incidentId: id, message: `Экипаж ${responderCode} назначен на ${id}` },
    });
    const updated = await this.prisma.incident.findUniqueOrThrow({ where: { id }, include: incidentInclude });
    this.events.emit('incident.update', { incident: this.serialize(updated, true) });
  }

  async removeResponder(id: string, responderCode: string) {
    await this.prisma.incidentResponder.deleteMany({
      where: { incidentId: id, responderCode },
    });
    const updated = await this.prisma.incident.findUniqueOrThrow({ where: { id }, include: incidentInclude });
    this.events.emit('incident.update', { incident: this.serialize(updated, true) });
  }

  async createFromIngest(items: Array<{
    id: string; type: string; priority: string; title: string; address: string;
    districtCode: string; lat: number; lng: number; source?: string;
  }>) {
    for (const it of items) {
      const inc = await this.prisma.incident.upsert({
        where: { id: it.id },
        update: {},
        create: {
          id: it.id,
          type: it.type.toUpperCase() as any,
          priority: it.priority.toUpperCase() as any,
          title: it.title,
          address: it.address,
          districtCode: it.districtCode,
          lat: it.lat,
          lng: it.lng,
          source: it.source ?? null,
        },
        include: incidentInclude,
      });
      this.events.emit('incident.new', { incident: this.serialize(inc, true) });
    }
  }

  serialize(inc: FullIncident, includeTimeline: boolean) {
    const seconds = Math.max(0, Math.floor((Date.now() - inc.reportedAt.getTime()) / 1000));
    const humanised = this.humaniseAge(seconds);
    const base = {
      id: inc.id,
      type: TYPE_MAP[inc.type],
      priority: PRIO_MAP[inc.priority],
      title: inc.title,
      address: inc.address,
      district: { code: inc.district.code, name: inc.district.name },
      lat: inc.lat,
      lng: inc.lng,
      status: STATUS_MAP[inc.status],
      reportedAt: inc.reportedAt.toISOString(),
      acknowledgedAt: inc.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: inc.resolvedAt?.toISOString() ?? null,
      source: inc.source,
      injured: inc.injured,
      lanes: inc.lanes,
      avgSpeedKmh: inc.avgSpeedKmh,
      eta: inc.eta,
      age: { humanised, seconds },
      responders: inc.responders.map(r => ({
        code: r.responder.code,
        label: r.responder.label,
        kind: RESP_KIND_MAP[r.responder.kind],
        status: RESP_STATUS_MAP[r.status],
        eta: r.eta,
      })),
      cameras: [] as { code: string; label: string }[],
    };
    if (includeTimeline) {
      return {
        ...base,
        timeline: (inc.events ?? []).map(e => ({
          id: e.id,
          kind: EVENT_KIND_MAP[e.kind],
          at: e.at.toISOString(),
          comment: e.comment,
          actor: e.actor ? { id: e.actor.id, fullName: e.actor.fullName } : null,
        })),
        impact: this.impact(inc),
      };
    }
    return base;
  }

  private humaniseAge(seconds: number) {
    if (seconds < 60) return `${seconds} сек`;
    const min = Math.floor(seconds / 60);
    if (min < 60) return `${min} мин`;
    const h = Math.floor(min / 60);
    return `${h} ч ${min % 60} мин`;
  }

  private impact(inc: { priority: string }) {
    const seed = inc.priority === 'HIGH' ? 8 : inc.priority === 'MED' ? 5 : 3;
    const spark = Array.from({ length: 12 }, (_, i) => Number((seed + Math.sin(i / 2) * 2 + Math.random() * 0.6).toFixed(2)));
    return { spark, forecastDelayMin: seed * 3 };
  }
}
