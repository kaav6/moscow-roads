import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IngestTokenGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const got = req.headers['x-ingest-token'];
    const expected = this.cfg.get<string>('INGEST_TOKEN');
    if (!expected || got !== expected) {
      throw new UnauthorizedException('invalid ingest token');
    }
    return true;
  }
}
