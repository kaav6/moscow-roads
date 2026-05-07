import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DistrictsService } from './districts.service';

@ApiTags('districts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('districts')
export class DistrictsController {
  constructor(private readonly svc: DistrictsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get('ranking')
  ranking() {
    return this.svc.ranking();
  }
}
