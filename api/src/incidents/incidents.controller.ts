import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { IncidentsService } from './incidents.service';
import { IncidentFilterDto } from './dto/incident-filter.dto';
import { AssignResponderDto, CommentDto } from './dto/comment.dto';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly svc: IncidentsService) {}

  @Get()
  list(@Query() filter: IncidentFilterDto) {
    return this.svc.list(filter);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.svc.detail(id);
  }

  @Get(':id/timeline')
  timeline(@Param('id') id: string) {
    return this.svc.timeline(id);
  }

  @Post(':id/escalate')
  @Roles('dispatcher')
  @HttpCode(204)
  async escalate(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: CommentDto) {
    await this.svc.escalate(id, user.sub, body.comment);
  }

  @Post(':id/acknowledge')
  @Roles('operator', 'dispatcher')
  @HttpCode(204)
  async acknowledge(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: CommentDto) {
    await this.svc.acknowledge(id, user.sub, body.comment);
  }

  @Post(':id/resolve')
  @Roles('operator', 'dispatcher')
  @HttpCode(204)
  async resolve(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: CommentDto) {
    await this.svc.resolve(id, user.sub, body.comment);
  }

  @Post(':id/responders')
  @Roles('dispatcher')
  @HttpCode(204)
  async assign(@Param('id') id: string, @Body() body: AssignResponderDto) {
    await this.svc.assignResponder(id, body.responderCode, body.eta);
  }

  @Delete(':id/responders/:code')
  @Roles('dispatcher')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Param('code') code: string) {
    await this.svc.removeResponder(id, code);
  }
}
