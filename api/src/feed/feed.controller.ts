import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedService } from './feed.service';

@ApiTags('feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly svc: FeedService) {}

  @Get()
  list(
    @Query('tag') tag?: string,
    @Query('incidentId') incidentId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    return this.svc.list(tag, incidentId, q, page ? Number(page) : 0, size ? Number(size) : 100);
  }
}
