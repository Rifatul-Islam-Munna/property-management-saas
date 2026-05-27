import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Announcement, AnnouncementSchema } from 'src/announcement/entities/announcement.entity';
import { Bill, BillSchema } from 'src/bill/entities/bill.entity';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketSchema } from 'src/ticket/entities/ticket.entity';
import { TicketModule } from 'src/ticket/ticket.module';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { AiController } from './ai.controller';
import { AiMcpService } from './ai-mcp.service';
import { AiMcpServerService } from './ai-mcp-server.service';
import { AiService } from './ai.service';
import { AiSessionService } from './ai-session.service';
import {
  AiProviderConfig,
  AiProviderConfigSchema,
} from './entities/ai-provider-config.entity';

@Module({
  imports: [
    TicketModule,
    MongooseModule.forFeature([
      { name: AiProviderConfig.name, schema: AiProviderConfigSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Bill.name, schema: BillSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, AiMcpService, AiMcpServerService, AiSessionService],
  exports: [AiService, AiMcpService],
})
export class AiModule {}
