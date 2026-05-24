import { PartialType } from '@nestjs/swagger';
import { CreateRecurringMaintenanceDto } from './create-recurring-maintenance.dto';

export class UpdateRecurringMaintenanceDto extends PartialType(CreateRecurringMaintenanceDto) {}
