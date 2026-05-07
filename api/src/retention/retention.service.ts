import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IncidentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger('RetentionService');

  constructor(private readonly prisma: PrismaService) {}

  @Cron('30 2 * * *')
  async purgeIncidents() {
    const cutoff = new Date(Date.now() - 90 * 86_400_000);
    const r = await this.prisma.incident.deleteMany({
      where: { status: IncidentStatus.RESOLVED, resolvedAt: { lt: cutoff } },
    });
    this.logger.log(`purged ${r.count} resolved incidents`);
  }

  @Cron('35 2 * * *')
  async purgeFeed() {
    const cutoff = new Date(Date.now() - 30 * 86_400_000);
    const r = await this.prisma.feedEvent.deleteMany({ where: { ts: { lt: cutoff } } });
    this.logger.log(`purged ${r.count} feed events`);
  }

  @Cron('40 2 * * *')
  async purgeKpi() {
    const cutoff = new Date(Date.now() - 30 * 86_400_000);
    const r = await this.prisma.kpiSnapshot.deleteMany({ where: { ts: { lt: cutoff } } });
    this.logger.log(`purged ${r.count} kpi snapshots`);
  }

  @Cron('45 2 * * *')
  async purgeJam() {
    const cutoff = new Date(Date.now() - 30 * 86_400_000);
    const r = await this.prisma.jamSegment.deleteMany({ where: { ts: { lt: cutoff } } });
    this.logger.log(`purged ${r.count} jam segments`);
  }
}
