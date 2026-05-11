import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [ContactsController, CompaniesController, TagsController],
  providers: [ContactsService, CompaniesService, TagsService],
  exports: [ContactsService],
})
export class ContactsModule {}
