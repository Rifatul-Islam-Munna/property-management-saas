import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Technician, TechnicianSchema } from './entities/technician.entity';
import { TechnicianController } from './technician.controller';
import { TechnicianService } from './technician.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Technician.name, schema: TechnicianSchema },
    ]),
  ],
  controllers: [TechnicianController],
  providers: [TechnicianService],
  exports: [TechnicianService],
})
export class TechnicianModule {}
