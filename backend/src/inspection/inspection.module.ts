import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { Inspection, InspectionSchema } from './entities/inspection.entity';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: Inspection.name, schema: InspectionSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
    ]),
  ],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
