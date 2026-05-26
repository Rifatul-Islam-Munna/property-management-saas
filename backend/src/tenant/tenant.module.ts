import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'src/bill/entities/bill.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { AssignmentRequest, AssignmentRequestSchema } from 'src/user/entities/assignment-request.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Tenant, TenantSchema } from './entities/tenant.entity';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Bill.name, schema: BillSchema },
      { name: AssignmentRequest.name, schema: AssignmentRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
