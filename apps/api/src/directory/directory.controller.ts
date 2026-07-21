import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateDirectoryGroupDto } from './dto/create-directory-group.dto';
import { CreateDirectoryUserDto } from './dto/create-directory-user.dto';
import { UpdateDirectoryGroupDto } from './dto/update-directory-group.dto';
import { UpdateDirectoryUserDto } from './dto/update-directory-user.dto';
import { UpdateGroupMembersDto } from './dto/update-group-members.dto';
import { UpdateGroupRolesDto } from './dto/update-group-roles.dto';
import { DirectorySyncService } from './directory-sync.service';
import { DirectoryService } from './directory.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('directory.manage')
@Controller('directory')
export class DirectoryController {
  constructor(
    private readonly directoryService: DirectoryService,
    private readonly directorySyncService: DirectorySyncService,
  ) {}

  @Get('users')
  findUsers() {
    return this.directoryService.findUsers();
  }

  @Post('sync')
  sync() {
    return this.directorySyncService.sync();
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

  @Put('groups/:id/roles')
  updateGroupRoles(
    @Param('id') id: string,
    @Body() dto: UpdateGroupRolesDto,
  ) {
    return this.directoryService.updateGroupRoles(id, dto);
  }

  @Delete('groups/:id')
  removeGroup(@Param('id') id: string) {
    return this.directoryService.removeGroup(id);
  }
}
