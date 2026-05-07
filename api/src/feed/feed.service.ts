import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedTag } from '@prisma/client';

const TAG_MAP: Record<FeedTag, string> = {
  EVENT: 'event',
  DISPATCH: 'dispatch',
  CAMERA: 'camera',
  INCIDENT: 'incident',
  SENSOR: 'sensor',
  STATUS: 'status',
  WEATHER: 'weather',
};

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tag?: string, incidentId?: string, q?: string, page = 0, size = 100) {
    const where: any = {};
    if (tag) where.tag = tag.toUpperCase();
    if (incidentId) where.incidentId = incidentId;
    if (q) where.message = { contains: q, mode: 'insensitive' };
    size = Math.min(size, 200);
    const rows = await this.prisma.feedEvent.findMany({
      where,
      orderBy: { ts: 'desc' },
      skip: page * size,
      take: size,
    });
    return rows.map(r => ({
      id: r.id,
      ts: r.ts.toISOString(),
      tag: TAG_MAP[r.tag],
      incidentId: r.incidentId,
      message: r.message,
      meta: r.meta,
    }));
  }

  serialize(r: { id: number; ts: Date; tag: FeedTag; incidentId: string | null; message: string; meta: string | null }) {
    return {
      id: r.id,
      ts: r.ts.toISOString(),
      tag: TAG_MAP[r.tag],
      incidentId: r.incidentId,
      message: r.message,
      meta: r.meta,
    };
  }
}
