import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { FinanceEntryController } from './finance-entry.controller';
import { FinanceEntryService } from './finance-entry.service';
import { FinanceEntry, FinanceEntrySchema } from './entities/finance-entry.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: FinanceEntry.name, schema: FinanceEntrySchema }, { name: Organization.name, schema: OrganizationSchema }])],
  controllers: [FinanceEntryController],
  providers: [FinanceEntryService],
  exports: [FinanceEntryService],
})
export class FinanceEntryModule {}
