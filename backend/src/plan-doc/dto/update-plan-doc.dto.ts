import { PartialType } from '@nestjs/swagger';
import { CreatePlanDocDto } from './create-plan-doc.dto';

export class UpdatePlanDocDto extends PartialType(CreatePlanDocDto) {}
