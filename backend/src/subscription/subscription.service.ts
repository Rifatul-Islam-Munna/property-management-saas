import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QueryPlanDto } from './dto/query-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { BillingInterval, Plan, PlanDocument } from './entities/plan.entity';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatusRecord,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createPlan(dto: CreatePlanDto): Promise<any> {
    const plan = await this.planModel.create(dto);
    const paddleCatalog = await this.tryCreatePaddleCatalog(plan.toObject());

    if (paddleCatalog) {
      plan.paddleProductId = paddleCatalog.productId;
      plan.paddlePriceIdMonthly = paddleCatalog.monthlyPriceId;
      plan.paddlePriceIdYearly = paddleCatalog.yearlyPriceId;
      await plan.save();
    }

    return plan.toObject();
  }

  async findPlans(query: QueryPlanDto): Promise<any> {
    const { page = 1, limit = 20, search, isActive } = query;
    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive;

    const [data, total] = await Promise.all([
      this.planModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.planModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublicPlans(query: QueryPlanDto): Promise<any> {
    const result = await this.findPlans({ ...query, isActive: true });
    const data = (result.data ?? []).map((plan: Record<string, any>) => ({
      _id: plan._id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxProperties: plan.maxProperties,
      maxUsers: plan.maxUsers,
      features: plan.features ?? [],
      isActive: plan.isActive,
      paddlePriceIdMonthly: plan.paddlePriceIdMonthly ?? null,
      paddlePriceIdYearly: plan.paddlePriceIdYearly ?? null,
    }));

    return {
      ...result,
      data,
    };
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<any> {
    const plan = await this.planModel.findByIdAndUpdate(id, dto, { new: true });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan.toObject();
  }

  async removePlan(id: string): Promise<{ deleted: boolean }> {
    const plan = await this.planModel.findByIdAndDelete(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return { deleted: true };
  }

  async createSubscription(actor: JwtUser, dto: CreateSubscriptionDto): Promise<any> {
    const plan = await this.planModel.findById(dto.planId).lean();
    if (!plan) throw new NotFoundException('Plan not found');

    const amount =
      dto.billingInterval === BillingInterval.MONTHLY
        ? plan.monthlyPrice
        : plan.yearlyPrice;

    const subscription = await this.subscriptionModel.create({
      organizationId: dto.organizationId,
      ownerUserId: actor.id,
      planId: dto.planId,
      billingInterval: dto.billingInterval,
      status: SubscriptionStatusRecord.PENDING,
      amount,
      meta: {},
    });

    const paddlePayload = await this.tryCreatePaddleCheckout(plan, dto.billingInterval);

    return {
      ...subscription.toObject(),
      paddle: paddlePayload,
    };
  }

  async findSubscriptions(organizationId?: string): Promise<any[]> {
    const filter = organizationId ? { organizationId } : {};
    return this.subscriptionModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async activateSubscription(id: string): Promise<any> {
    const now = new Date();
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription) throw new NotFoundException('Subscription not found');
    subscription.status = SubscriptionStatusRecord.ACTIVE;
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = new Date(
      now.getTime() +
        (subscription.billingInterval === BillingInterval.MONTHLY
          ? 30
          : 365) *
          24 *
          60 *
          60 *
          1000,
    );
    await subscription.save();
    return subscription.toObject();
  }

  async cancelSubscription(id: string): Promise<any> {
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription) throw new NotFoundException('Subscription not found');
    subscription.status = SubscriptionStatusRecord.CANCELLED;
    await subscription.save();
    return subscription.toObject();
  }

  private async tryCreatePaddleCheckout(
    plan: Record<string, any>,
    billingInterval: BillingInterval,
  ): Promise<Record<string, any> | null> {
    const paddleApiKey = this.configService.get<string>('PADDLE_API_KEY');
    const paddleEnv = this.configService.get<string>('PADDLE_ENVIRONMENT');

    if (!paddleApiKey) {
      this.logger.warn('Paddle not initialized. Missing PADDLE_API_KEY.');
      return null;
    }

    const priceId =
      billingInterval === BillingInterval.MONTHLY
        ? plan.paddlePriceIdMonthly
        : plan.paddlePriceIdYearly;

    if (!priceId) {
      this.logger.warn(`Paddle price id missing for plan ${plan.name}.`);
      return null;
    }

    try {
      return {
        provider: 'paddle',
        environment: paddleEnv ?? 'sandbox',
        priceId,
        checkoutUrl: null,
        message: 'Paddle placeholder created. Real API call can be added later.',
      };
    } catch (error) {
      this.logger.error('Paddle checkout creation failed', (error as Error).stack);
      return null;
    }
  }

  private async tryCreatePaddleCatalog(
    plan: Record<string, any>,
  ): Promise<{ productId: string; monthlyPriceId: string; yearlyPriceId: string } | null> {
    const paddleApiKey = this.configService.get<string>('PADDLE_API_KEY');
    const paddleEnv = this.configService.get<string>('PADDLE_ENVIRONMENT') ?? 'sandbox';
    const currencyCode = this.configService.get<string>('PADDLE_CURRENCY_CODE') ?? 'USD';

    if (!paddleApiKey) {
      this.logger.warn(`Paddle not initialized. Skipping catalog sync for plan ${plan.name}.`);
      return null;
    }

    const baseUrl =
      paddleEnv === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

    try {
      const headers = {
        Authorization: `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      };

      const productResponse = await axios.post(
        `${baseUrl}/products`,
        {
          name: plan.name,
          description: plan.description ?? `${plan.name} subscription plan`,
          tax_category: 'saas',
        },
        { headers },
      );

      const productId = productResponse.data?.data?.id as string | undefined;

      if (!productId) {
        this.logger.warn(`Paddle product creation returned no id for plan ${plan.name}.`);
        return null;
      }

      const [monthlyPriceId, yearlyPriceId] = await Promise.all([
        this.createPaddlePrice({
          baseUrl,
          headers,
          productId,
          currencyCode,
          planName: plan.name,
          amount: plan.monthlyPrice,
          interval: 'month',
        }),
        this.createPaddlePrice({
          baseUrl,
          headers,
          productId,
          currencyCode,
          planName: plan.name,
          amount: plan.yearlyPrice,
          interval: 'year',
        }),
      ]);

      if (!monthlyPriceId || !yearlyPriceId) {
        this.logger.warn(`Paddle price sync incomplete for plan ${plan.name}.`);
        return null;
      }

      return {
        productId,
        monthlyPriceId,
        yearlyPriceId,
      };
    } catch (error) {
      this.logger.error(
        `Paddle catalog sync failed for plan ${plan.name}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return null;
    }
  }

  private async createPaddlePrice({
    baseUrl,
    headers,
    productId,
    currencyCode,
    planName,
    amount,
    interval,
  }: {
    baseUrl: string;
    headers: Record<string, string>;
    productId: string;
    currencyCode: string;
    planName: string;
    amount: number;
    interval: 'month' | 'year';
  }): Promise<string | null> {
    const centsAmount = String(Math.round(Number(amount ?? 0) * 100));

    const response = await axios.post(
      `${baseUrl}/prices`,
      {
        description: `${planName} ${interval} billing`,
        name: `${planName} ${interval === 'month' ? 'Monthly' : 'Yearly'}`,
        product_id: productId,
        billing_cycle: {
          interval,
          frequency: 1,
        },
        unit_price: {
          amount: centsAmount,
          currency_code: currencyCode,
        },
      },
      { headers },
    );

    return (response.data?.data?.id as string | undefined) ?? null;
  }
}
