import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssignmentRequestStatus } from '../entities/assignment-request.entity';

export class UpdateAssignmentRequestStatusDto {
  @ApiProperty({ enum: [AssignmentRequestStatus.ACCEPTED, AssignmentRequestStatus.REJECTED] })
  @IsEnum(AssignmentRequestStatus)
  status: AssignmentRequestStatus.ACCEPTED | AssignmentRequestStatus.REJECTED;
}
