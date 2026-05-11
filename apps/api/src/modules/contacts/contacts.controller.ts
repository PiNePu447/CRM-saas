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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts (visibility scoped by role)' })
  findAll(@CurrentUser() user: CurrentUserData, @Query() query: ListContactsDto) {
    return this.contactsService.findAll(user.tenantId, user.sub, user.role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details with deals and tasks' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.contactsService.findOne(id, user.tenantId, user.sub, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user.tenantId, user.sub, user.role, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, user.tenantId, user.sub, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a contact' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.contactsService.remove(id, user.tenantId, user.sub, user.role);
  }

  @Delete(':id/gdpr')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'LGPD: anonymize and delete all personal data' })
  gdprDelete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.contactsService.gdprDelete(id, user.tenantId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get contact activity timeline (cursor-based pagination)' })
  getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.contactsService.getTimeline(id, user.tenantId, user.sub, user.role, cursor, parsedLimit);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add an activity to the contact timeline' })
  createActivity(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateActivityDto,
  ) {
    return this.contactsService.createActivity(id, user.tenantId, user.sub, user.role, dto);
  }
}
