import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { RecurringMaintenance, RecurringMaintenanceSchema } from './entities/recurring-maintenance.entity';
import { RecurringMaintenanceController } from './recurring-maintenance.controller';
import { RecurringMaintenanceService } from './recurring-maintenance.service';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: RecurringMaintenance.name, schema: RecurringMaintenanceSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
    ]),
  ],
  controllers: [RecurringMaintenanceController],
  providers: [RecurringMaintenanceService],
  exports: [RecurringMaintenanceService],
})
export class RecurringMaintenanceModule {}
