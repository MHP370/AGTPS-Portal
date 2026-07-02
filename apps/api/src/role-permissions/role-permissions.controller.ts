import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { RolePermissionsService } from './role-permissions.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Controller('roles/:roleId/permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Get()
  findByRole(
    @Param('roleId') roleId: string,
  ) {
    return this.rolePermissionsService.findByRole(roleId);
  }

  @Post()
  assign(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolePermissionsService.assign(
      roleId,
      dto.permissionId,
    );
  }

  @Delete(':permissionId')
  remove(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolePermissionsService.remove(
      roleId,
      permissionId,
    );
  }
}
