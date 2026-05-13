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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformService } from './platform.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';

@ApiTags('Platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  listTenants() {
    return this.platformService.listTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get a tenant with users and stats' })
  getTenant(@Param('id') id: string) {
    return this.platformService.getTenant(id);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new tenant with initial SUPER_ADMIN user' })
  createTenant(@Body() dto: CreateTenantDto) {
    return this.platformService.createTenant(dto);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant name, settings or active status' })
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.platformService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tenant' })
  deleteTenant(@Param('id') id: string) {
    return this.platformService.deleteTenant(id);
  }

  @Post('tenants/:id/super-admins')
  @ApiOperation({ summary: 'Create a SUPER_ADMIN user for a tenant' })
  createSuperAdmin(@Param('id') id: string, @Body() dto: CreateSuperAdminDto) {
    return this.platformService.createSuperAdmin(id, dto);
  }
}
