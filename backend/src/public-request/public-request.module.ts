import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { Bill, BillSchema } from 'src/bill/entities/bill.entity';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketSchema } from 'src/ticket/entities/ticket.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { PublicRequestController } from './public-request.controller';
import { PublicRequestService } from './public-request.service';

@Module({
  imports: [
    AuditLogModule,
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Unit.name, schema: UnitSchema },
    ]),
  ],
  controllers: [PublicRequestController],
  providers: [PublicRequestService],
})
export class PublicRequestModule {}
