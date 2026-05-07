import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KpiService } from './kpi.service';

@ApiTags('kpi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kpi')
export class KpiController {
  constructor(private readonly svc: KpiService) {}

  @Get()
  latest() {
    return this.svc.latest();
  }

  @Get('history')
  history(@Query('range') range?: '15m' | '1h' | '6h' | '24h', @Query('step') step?: string) {
    return this.svc.history(range ?? '1h', step ?? '5m');
  }
}
