import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { User, UserDocument, UserRole } from 'src/user/entities/user.entity';
import { CreatePlanDocDto } from './dto/create-plan-doc.dto';
import { QueryPlanDocDto } from './dto/query-plan-doc.dto';
import { UpdatePlanDocShareDto } from './dto/update-plan-doc-share.dto';
import { UpdatePlanDocDto } from './dto/update-plan-doc.dto';
import {
  PlanDoc,
  PlanDocAccess,
  PlanDocDocument,
} from './entities/plan-doc.entity';

@Injectable()
export class PlanDocService {
  constructor(
    @InjectModel(PlanDoc.name)
    private readonly planDocModel: Model<PlanDocDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(actor: JwtUser, dto: CreatePlanDocDto) {
    const doc = await this.planDocModel.create({
      organizationId: actor.organizationId ?? '',
      title: dto.title,
      description: dto.description ?? null,
      createdByUserId: actor.id,
      createdByName: actor.fullName,
      createdByRole: actor.role,
      nodes: dto.nodes ?? [],
      edges: dto.edges ?? [],
      viewport: dto.viewport ?? { x: 0, y: 0, zoom: 1 },
      sharedWith: this.normalizeShareList(dto.sharedWith ?? [], actor.id),
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });

    return doc.toObject();
  }

  async findAll(actor: JwtUser, query: QueryPlanDocDto) {
    const { page = 1, limit = 20, search } = query;
    const filter = this.buildAccessFilter(actor);

    if (search?.trim()) {
      filter.$and = [
        ...(filter.$and ?? []),
        {
          $or: [
            { title: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.planDocModel
        .find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.planDocModel.countDocuments(filter),
    ]);

    return {
      data: data.map((item) => this.decoratePlan(item, actor.id)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(actor: JwtUser, id: string) {
    const item = await this.planDocModel
      .findOne({
        _id: id,
        ...this.buildAccessFilter(actor),
      })
      .lean();

    if (!item) {
      throw new NotFoundException('Plan not found');
    }

    return this.decoratePlan(item, actor.id);
  }

  async update(actor: JwtUser, id: string, dto: UpdatePlanDocDto) {
    const existing = await this.planDocModel.findById(id).lean();

    if (!existing || !this.canAccess(existing, actor)) {
      throw new NotFoundException('Plan not found');
    }

    if (!this.canEdit(existing, actor)) {
      throw new ForbiddenException('No edit access for this plan');
    }

    const next = await this.planDocModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          ...(dto.sharedWith
            ? { sharedWith: this.normalizeShareList(dto.sharedWith, actor.id) }
            : {}),
          updatedByUserId: actor.id,
          updatedByName: actor.fullName,
          updatedByRole: actor.role,
        },
        { new: true },
      )
      .lean();

    if (!next) {
      throw new NotFoundException('Plan not found');
    }

    return this.decoratePlan(next, actor.id);
  }

  async updateShare(actor: JwtUser, id: string, dto: UpdatePlanDocShareDto) {
    const existing = await this.planDocModel.findById(id).lean();

    if (!existing || !this.canAccess(existing, actor)) {
      throw new NotFoundException('Plan not found');
    }

    if (!this.canManageShare(existing, actor)) {
      throw new ForbiddenException('No share access for this plan');
    }

    const next = await this.planDocModel
      .findByIdAndUpdate(
        id,
        {
          sharedWith: this.normalizeShareList(dto.sharedWith, actor.id),
          updatedByUserId: actor.id,
          updatedByName: actor.fullName,
          updatedByRole: actor.role,
        },
        { new: true },
      )
      .lean();

    if (!next) {
      throw new NotFoundException('Plan not found');
    }

    return this.decoratePlan(next, actor.id);
  }

  async remove(actor: JwtUser, id: string) {
    const existing = await this.planDocModel.findById(id).lean();

    if (!existing || !this.canAccess(existing, actor)) {
      throw new NotFoundException('Plan not found');
    }

    if (!this.canDelete(existing, actor)) {
      throw new ForbiddenException('Only owner can delete this plan');
    }

    await this.planDocModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async findShareCandidates(actor: JwtUser, search?: string) {
    const filter: FilterQuery<UserDocument> = {
      organizationId: actor.organizationId ?? '',
      _id: { $ne: actor.id },
      status: 'active',
    };

    if (search?.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(filter)
      .sort({ fullName: 1 })
      .limit(25)
      .lean();

    return users.map((user) => ({
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    }));
  }

  private buildAccessFilter(actor: JwtUser): FilterQuery<PlanDocDocument> {
    const andFilters: FilterQuery<PlanDocDocument>[] = [];

    if (actor.organizationId) {
      andFilters.push({ organizationId: actor.organizationId });
    }

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)) {
      andFilters.push({
        $or: [
          { createdByUserId: actor.id },
          { 'sharedWith.userId': actor.id },
        ],
      });
    }

    if (!andFilters.length) {
      return {};
    }

    if (andFilters.length === 1) {
      return andFilters[0];
    }

    return { $and: andFilters };
  }

  private canAccess(item: any, actor: JwtUser) {
    if (actor.organizationId && item.organizationId !== actor.organizationId) {
      return false;
    }

    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)) {
      return true;
    }

    return (
      item.createdByUserId === actor.id ||
      (item.sharedWith ?? []).some((entry: any) => entry.userId === actor.id)
    );
  }

  private canEdit(item: any, actor: JwtUser) {
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)) {
      return true;
    }

    if (item.createdByUserId === actor.id) {
      return true;
    }

    return (item.sharedWith ?? []).some(
      (entry: any) =>
        entry.userId === actor.id && entry.access === PlanDocAccess.EDIT,
    );
  }

  private canManageShare(item: any, actor: JwtUser) {
    return (
      item.createdByUserId === actor.id ||
      [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)
    );
  }

  private canDelete(item: any, actor: JwtUser) {
    return (
      item.createdByUserId === actor.id ||
      [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)
    );
  }

  private normalizeShareList(sharedWith: any[], actorId: string) {
    const seen = new Set<string>();
    return sharedWith
      .filter((entry) => entry?.userId && entry.userId !== actorId)
      .filter((entry) => {
        if (seen.has(entry.userId)) return false;
        seen.add(entry.userId);
        return true;
      })
      .map((entry) => ({
        userId: entry.userId,
        fullName: entry.fullName ?? null,
        email: entry.email?.toLowerCase?.() ?? null,
        access:
          entry.access === PlanDocAccess.EDIT
            ? PlanDocAccess.EDIT
            : PlanDocAccess.VIEW,
      }));
  }

  private decoratePlan(item: any, actorId: string) {
    const myShare = (item.sharedWith ?? []).find(
      (entry: any) => entry.userId === actorId,
    );
    const isOwner = item.createdByUserId === actorId;
    const canEdit = isOwner || myShare?.access === PlanDocAccess.EDIT;

    return {
      ...item,
      isOwner,
      canEdit,
      myAccess: isOwner ? PlanDocAccess.EDIT : myShare?.access ?? null,
    };
  }
}
