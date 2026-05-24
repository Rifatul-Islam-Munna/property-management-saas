import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Plan, PlanSchema } from './entities/plan.entity';
import { PublicSubscriptionController } from './public-subscription.controller';
import { Subscription, SubscriptionSchema } from './entities/subscription.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SubscriptionController, PublicSubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
