import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CamerasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(districtCode?: string, online?: string) {
    const where: any = {};
    if (districtCode) where.districtCode = districtCode;
    if (online === 'true') where.online = true;
    if (online === 'false') where.online = false;
    const rows = await this.prisma.camera.findMany({
      where,
      include: { district: true },
      orderBy: { code: 'asc' },
    });
    return rows.map(c => ({
      code: c.code,
      label: c.label,
      district: c.district ? { code: c.district.code, name: c.district.name } : null,
      lat: c.lat,
      lng: c.lng,
      online: c.online,
      hasRtsp: !!c.rtspUrl,
    }));
  }

  async detail(code: string) {
    const c = await this.prisma.camera.findUnique({ where: { code }, include: { district: true } });
    if (!c) throw new NotFoundException('camera not found');
    return {
      code: c.code,
      label: c.label,
      district: c.district ? { code: c.district.code, name: c.district.name } : null,
      lat: c.lat,
      lng: c.lng,
      online: c.online,
      hasRtsp: !!c.rtspUrl,
    };
  }

  async snapshot(code: string) {
    await this.detail(code);
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';
    return { code, ts: new Date().toISOString(), image: `data:image/png;base64,${png}` };
  }
}
