import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill, BillSchema } from './entities/bill.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
