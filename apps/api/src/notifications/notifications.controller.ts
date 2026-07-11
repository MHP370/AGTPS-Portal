import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { NotificationsService } from './notifications.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.findAll(request.user);
  }

  @Get('push/config')
  getPushConfig() {
    return this.notificationsService.getPushConfig();
  }

  @Post('push/subscribe')
  subscribe(@Body() dto: PushSubscriptionDto) {
    return this.notificationsService.subscribe(dto);
  }

  @Post('push/unsubscribe')
  unsubscribe(@Body() dto: PushSubscriptionDto) {
    return this.notificationsService.unsubscribe(dto);
  }

  @Put('read-all')
  @UseGuards(OptionalJwtAuthGuard)
  markAllRead(
    @Req()
    request: Request & {
      user?: { id: string; username?: string; email?: string };
    },
  ) {
    return this.notificationsService.markAllRead(request.user);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
