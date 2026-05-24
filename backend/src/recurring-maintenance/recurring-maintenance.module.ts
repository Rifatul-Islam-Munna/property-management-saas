import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringMaintenance, RecurringMaintenanceSchema } from './entities/recurring-maintenance.entity';
import { RecurringMaintenanceController } from './recurring-maintenance.controller';
import { RecurringMaintenanceService } from './recurring-maintenance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringMaintenance.name, schema: RecurringMaintenanceSchema },
    ]),
  ],
  controllers: [RecurringMaintenanceController],
  providers: [RecurringMaintenanceService],
  exports: [RecurringMaintenanceService],
})
export class RecurringMaintenanceModule {}
