import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateDirectoryGroupDto } from './dto/create-directory-group.dto';
import { CreateDirectoryUserDto } from './dto/create-directory-user.dto';
import { UpdateDirectoryGroupDto } from './dto/update-directory-group.dto';
import { UpdateDirectoryUserDto } from './dto/update-directory-user.dto';
import { UpdateGroupMembersDto } from './dto/update-group-members.dto';
import { DirectoryService } from './directory.service';

@Controller('directory')
export class DirectoryController {
  constructor(
    private readonly directoryService: DirectoryService,
  ) {}

  @Get('users')
  findUsers() {
    return this.directoryService.findUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateDirectoryUserDto) {
    return this.directoryService.createUser(dto);
  }

  @Put('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateDirectoryUserDto,
  ) {
    return this.directoryService.updateUser(id, dto);
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string) {
    return this.directoryService.removeUser(id);
  }

  @Get('groups')
  findGroups() {
    return this.directoryService.findGroups();
  }

  @Post('groups')
  createGroup(@Body() dto: CreateDirectoryGroupDto) {
    return this.directoryService.createGroup(dto);
  }

  @Put('groups/:id')
  updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateDirectoryGroupDto,
  ) {
    return this.directoryService.updateGroup(id, dto);
  }

  @Put('groups/:id/members')
  updateGroupMembers(
    @Param('id') id: string,
    @Body() dto: UpdateGroupMembersDto,
  ) {
    return this.directoryService.updateGroupMembers(id, dto);
  }

  @Delete('groups/:id')
  removeGroup(@Param('id') id: string) {
    return this.directoryService.removeGroup(id);
  }
}
