import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
  OwnerSubscriptionTier,
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './entities/user.entity';

@Injectable()
export class UserSeedService implements OnModuleInit {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    const email = 'test@gmail.com';
    const existingUser = await this.userModel.findOne({ email }).lean();

    if (existingUser) {
      this.logger.log('Default super admin already exists');
      return;
    }

    const password = await bcrypt.hash('11111111', 10);

    await this.userModel.create({
      fullName: 'Test Super Admin',
      email,
      phoneNumber: '01700000000',
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      organizationId: null,
      organizationIds: [],
      ownerIds: [],
      activeOwnerId: null,
      propertyIds: [],
      activePropertyId: null,
      isGlobalProfile: false,
      subscriptionTier: OwnerSubscriptionTier.ENTERPRISE,
      subscriptionRequired: false,
      subscriptionActive: true,
      subscriptionStartsAt: new Date(),
      subscriptionEndsAt: null,
    });

    this.logger.log('Default super admin created: test@gmail.com');
  }
}
