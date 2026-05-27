import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List users in the tenant (MANAGER sees only their sellers)' })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.usersService.findAll(user.tenantId, user.sub, user.role as UserRole);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.usersService.findOne(id, user.tenantId, user.sub, user.role as UserRole);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Invite a new user (MANAGER can only create SELLERs)' })
  invite(@CurrentUser() user: CurrentUserData, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user.tenantId, user.sub, user.role as UserRole, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a user (MANAGER can only edit their own sellers)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.tenantId, user.sub, user.role as UserRole, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (MANAGER can only remove their own sellers)' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.usersService.remove(id, user.tenantId, user.sub, user.role as UserRole);
  }

  @Patch(':id/assign-manager')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign a seller to a manager (MANAGER can only assign to themselves)' })
  assignManager(
    @Param('id') sellerId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { managerId: string | null },
  ) {
    const managerId =
      user.role === UserRole.MANAGER
        ? user.sub
        : body.managerId;

    return this.usersService.assignSellerToManager(sellerId, managerId, user.tenantId);
  }
}
