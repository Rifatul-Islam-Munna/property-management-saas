import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceEntry, FinanceEntrySchema } from 'src/finance-entry/entities/finance-entry.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Staff, StaffSchema } from './entities/staff.entity';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: FinanceEntry.name, schema: FinanceEntrySchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
