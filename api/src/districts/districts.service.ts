import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentStatus } from '@prisma/client';

@Injectable()
export class DistrictsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const districts = await this.prisma.district.findMany({ orderBy: { code: 'asc' } });
    const counts = await this.prisma.incident.groupBy({
      by: ['districtCode'],
      where: { status: IncidentStatus.ACTIVE },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map(c => [c.districtCode, c._count._all]));
    return districts.map(d => ({
      code: d.code,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      score: d.score,
      incidents: { active: countMap.get(d.code) ?? 0 },
    }));
  }

  async ranking() {
    const items = await this.list();
    return items.sort((a, b) => b.score - a.score);
  }

  async updateScore(code: string, score: number) {
    await this.prisma.district.update({ where: { code }, data: { score } });
  }
}
