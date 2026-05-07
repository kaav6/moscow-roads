import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('actuator')
@Controller('actuator')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Get('info')
  info() {
    return {
      name: 'moscow-roads-api',
      version: process.env.npm_package_version ?? '1.0.0',
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
      node: process.version,
    };
  }
}
