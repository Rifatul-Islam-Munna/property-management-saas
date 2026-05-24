import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Technician, TechnicianSchema } from 'src/technician/entities/technician.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketSchema } from 'src/ticket/entities/ticket.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Technician.name, schema: TechnicianSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
