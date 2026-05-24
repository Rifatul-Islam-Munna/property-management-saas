import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class RegisterWorkerDto extends OmitType(CreateUserDto, ['role', 'organizationId', 'propertyIds'] as const) {}
