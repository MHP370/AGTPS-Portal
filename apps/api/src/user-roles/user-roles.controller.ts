import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('users/:userId/roles')
export class UserRolesController {
  constructor(
    private readonly userRolesService: UserRolesService,
  ) {}

  @Get()
  findByUser(
    @Param('userId') userId: string,
  ) {
    return this.userRolesService.findByUser(userId);
  }

  @Post()
  assign(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.userRolesService.assign(
      userId,
      dto.roleId,
    );
  }

  @Delete(':roleId')
  remove(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.userRolesService.remove(
      userId,
      roleId,
    );
  }
}
