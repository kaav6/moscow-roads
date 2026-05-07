import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    return ctx.switchToHttp().getRequest().user;
  },
);
