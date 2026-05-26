import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from 'src/organization/entities/organization.entity';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import {
  AssignmentRequest,
  AssignmentRequestSchema,
} from './entities/assignment-request.entity';
import { User, UserSchema } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserSeedService } from './user-seed.service';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: AssignmentRequest.name, schema: AssignmentRequestSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserSeedService],
  exports: [UserService],
})
export class UserModule {}
