import { Controller, Get, Query, UseGuards, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard')
  @Header('Cache-Control', 'private, max-age=15')
  dashboard(@Query('range') range?: 'today' | 'week' | 'month') {
    return this.svc.dashboard(range ?? 'today');
  }
}
