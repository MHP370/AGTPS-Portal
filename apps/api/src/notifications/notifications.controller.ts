import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll() {
    return this.notificationsService.findAll();
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

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
