import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CamerasService } from './cameras.service';

@ApiTags('cameras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cameras')
export class CamerasController {
  constructor(private readonly svc: CamerasService) {}

  @Get()
  list(@Query('districtCode') districtCode?: string, @Query('online') online?: string) {
    return this.svc.list(districtCode, online);
  }

  @Get(':code')
  detail(@Param('code') code: string) {
    return this.svc.detail(code);
  }

  @Post(':code/snapshot')
  @Roles('operator', 'dispatcher')
  @HttpCode(200)
  snapshot(@Param('code') code: string) {
    return this.svc.snapshot(code);
  }
}
