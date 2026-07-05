import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
  ) {}

  @Get()
  findAll() {
    return this.meetingsService.findAll();
  }

  @Get('admin/all')
  findAllForAdmin() {
    return this.meetingsService.findAll(true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }
}
