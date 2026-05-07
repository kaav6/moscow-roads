import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/config.schema';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DistrictsModule } from './districts/districts.module';
import { IncidentsModule } from './incidents/incidents.module';
import { KpiModule } from './kpi/kpi.module';
import { CamerasModule } from './cameras/cameras.module';
import { FeedModule } from './feed/feed.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IngestModule } from './ingest/ingest.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MockModule } from './mock/mock.module';
import { RetentionModule } from './retention/retention.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    DistrictsModule,
    IncidentsModule,
    KpiModule,
    CamerasModule,
    FeedModule,
    AnalyticsModule,
    IngestModule,
    RealtimeModule,
    MockModule,
    RetentionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
