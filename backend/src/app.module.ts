import { AuthSupportModule } from './lib/auth-support.module';
import { AiModule } from './ai/ai.module';
import { FinanceEntryModule } from './finance-entry/finance-entry.module';
import { InspectionModule } from './inspection/inspection.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillModule } from './bill/bill.module';
import { ImageModule } from './image/image.module';
import { MessagingModule } from './messaging/messaging.module';
import { OrganizationModule } from './organization/organization.module';
import { PropertyModule } from './property/property.module';
import { RecurringMaintenanceModule } from './recurring-maintenance/recurring-maintenance.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TechnicianModule } from './technician/technician.module';
import { TenantModule } from './tenant/tenant.module';
import { TicketModule } from './ticket/ticket.module';
import { UnitModule } from './unit/unit.module';
import { UploadsModule } from './uploads/uploads.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { WorkOrderModule } from './work-order/work-order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthSupportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('ACCESS_TOKEN'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URL'),
      }),
    }),
    AiModule,
    AnalyticsModule,
    AnnouncementModule,
    BillModule,
    FinanceEntryModule,
    ImageModule,
    InspectionModule,
    MessagingModule,
    OrganizationModule,
    PropertyModule,
    RecurringMaintenanceModule,
    SubscriptionModule,
    TechnicianModule,
    TenantModule,
    TicketModule,
    UnitModule,
    UploadsModule,
    UserModule,
    VendorModule,
    WorkOrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
