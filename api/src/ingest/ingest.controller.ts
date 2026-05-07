import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IngestTokenGuard } from './ingest-token.guard';
import { IncidentsService } from '../incidents/incidents.service';

@ApiTags('ingest')
@UseGuards(IngestTokenGuard)
@Controller('ingest')
export class IngestController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post('incidents')
  @HttpCode(202)
  async incidentsIn(@Body() body: { items: any[] }) {
    await this.incidents.createFromIngest(body.items ?? []);
    return { accepted: body.items?.length ?? 0 };
  }

  @Post('heartbeat')
  @HttpCode(204)
  heartbeat() {
    return;
  }
}
