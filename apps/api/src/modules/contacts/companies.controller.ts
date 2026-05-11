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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompaniesService, CreateCompanyDto, UpdateCompanyDto } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'List all companies' })
  findAll(@CurrentUser() user: CurrentUserData, @Query('search') search?: string) {
    return this.companiesService.findAll(user.tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company with contacts' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.companiesService.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a company' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.companiesService.remove(id, user.tenantId);
  }
}
