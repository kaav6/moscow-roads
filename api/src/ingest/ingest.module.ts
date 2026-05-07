import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { IngestController } from './ingest.controller';
import { IngestTokenGuard } from './ingest-token.guard';

@Module({
  imports: [IncidentsModule],
  controllers: [IngestController],
  providers: [IngestTokenGuard],
})
export class IngestModule {}
