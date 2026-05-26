import { PartialType } from '@nestjs/swagger';
import { CreateFinanceEntryDto } from './create-finance-entry.dto';

export class UpdateFinanceEntryDto extends PartialType(CreateFinanceEntryDto) {}
