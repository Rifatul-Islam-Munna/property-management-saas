import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { Bill, BillSchema } from 'src/bill/entities/bill.entity';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { NotificationDeliveryLog, NotificationDeliveryLogSchema } from './entities/notification-delivery-log.entity';
import { NotificationTemplate, NotificationTemplateSchema } from './entities/notification-template.entity';
import { MailDeliveryService } from './mail-delivery.service';
import { NotificationController } from './notification.controller';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationService } from './notification.service';
import { SmsDeliveryService } from './sms-delivery.service';

@Module({
  imports: [
    AuditLogModule,
    MongooseModule.forFeature([
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: NotificationDeliveryLog.name, schema: NotificationDeliveryLogSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: User.name, schema: UserSchema },
      { name: Bill.name, schema: BillSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService, MailDeliveryService, SmsDeliveryService],
  exports: [NotificationService, MailDeliveryService, SmsDeliveryService],
})
export class NotificationModule {}
