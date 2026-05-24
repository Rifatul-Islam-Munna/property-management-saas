import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { QueryPlanDto } from './dto/query-plan.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('public-subscription')
@Controller('public/subscription')
export class PublicSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async findPlans(@Query() query: QueryPlanDto): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.findPublicPlans(query);
    return new SuccessResponseDto(200, 'Public plan list fetched', data);
  }
}
