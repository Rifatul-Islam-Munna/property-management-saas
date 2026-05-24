import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { MongoIdPipe } from 'src/lib/mongo-id.pipe';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QueryPlanDto } from './dto/query-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plans')
  @Roles(UserRole.SUPER_ADMIN)
  async createPlan(@Body() dto: CreatePlanDto): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.createPlan(dto);
    return new SuccessResponseDto(201, 'Plan created successfully', data);
  }

  @Get('plans')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findPlans(@Query() query: QueryPlanDto): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.findPlans(query);
    return new SuccessResponseDto(200, 'Plan list fetched', data);
  }

  @Patch('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async updatePlan(
    @Param('id', MongoIdPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.updatePlan(id, dto);
    return new SuccessResponseDto(200, 'Plan updated successfully', data);
  }

  @Delete('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async removePlan(@Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.removePlan(id);
    return new SuccessResponseDto(200, 'Plan deleted successfully', data);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async createSubscription(
    @Req() req: ExpressRequest,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.createSubscription(req.user, dto);
    return new SuccessResponseDto(201, 'Subscription created successfully', data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async findSubscriptions(@Req() req: ExpressRequest): Promise<SuccessResponseDto<any>> {
    const orgId =
      req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.organizationId ?? undefined;
    const data = await this.subscriptionService.findSubscriptions(orgId);
    return new SuccessResponseDto(200, 'Subscriptions fetched', data);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  async activate(@Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.activateSubscription(id);
    return new SuccessResponseDto(200, 'Subscription activated', data);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  async cancel(@Param('id', MongoIdPipe) id: string): Promise<SuccessResponseDto<any>> {
    const data = await this.subscriptionService.cancelSubscription(id);
    return new SuccessResponseDto(200, 'Subscription cancelled', data);
  }
}
