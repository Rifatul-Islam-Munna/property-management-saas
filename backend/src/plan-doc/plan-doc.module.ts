import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { PlanDocController } from './plan-doc.controller';
import { PlanDocService } from './plan-doc.service';
import { PlanDoc, PlanDocSchema } from './entities/plan-doc.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanDoc.name, schema: PlanDocSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PlanDocController],
  providers: [PlanDocService],
  exports: [PlanDocService],
})
export class PlanDocModule {}
