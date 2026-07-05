import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.manage')
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id/password')
  @Permissions('users.manage')
  changePassword(
    @Param('id') id: string,
    @Body() dto: ChangeUserPasswordDto,
  ) {
    return this.usersService.changePassword(id, dto.password);
  }
}
