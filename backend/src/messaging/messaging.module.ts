import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MinioService } from 'src/lib/minio.service';
import { Property, PropertySchema } from 'src/property/entities/property.entity';
import { Tenant, TenantSchema } from 'src/tenant/entities/tenant.entity';
import { Unit, UnitSchema } from 'src/unit/entities/unit.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { DocumentTemplateService } from './document-template.service';
import { Message, MessageSchema } from './entities/message.entity';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Message.name, schema: MessageSchema },
    { name: User.name, schema: UserSchema },
    { name: Tenant.name, schema: TenantSchema },
    { name: Property.name, schema: PropertySchema },
    { name: Unit.name, schema: UnitSchema },
  ])],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway, DocumentTemplateService, MinioService],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
