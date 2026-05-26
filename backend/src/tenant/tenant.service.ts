import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill, BillDocument, BillStatus } from 'src/bill/entities/bill.entity';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import {
  AssignmentRequest,
  AssignmentRequestDirection,
  AssignmentRequestDocument,
  AssignmentRequestStatus,
} from 'src/user/entities/assignment-request.entity';
import { User, UserDocument, UserRole } from 'src/user/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { RecordTenantPaymentDto } from './dto/record-tenant-payment.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  Tenant,
  TenantDocument,
  TenantKind,
  TenantPaymentStatus,
} from './entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
    @InjectModel(Bill.name)
    private readonly billModel: Model<BillDocument>,
    @InjectModel(AssignmentRequest.name)
    private readonly assignmentRequestModel: Model<AssignmentRequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    organizationId: string,
    ownerUserId: string,
    dto: CreateTenantDto,
  ): Promise<any> {
    const unit = dto.unitId
      ? await this.unitModel.findOne({ _id: dto.unitId, organizationId })
      : null;
    const linkedUser = dto.userId
      ? await this.userModel.findById(dto.userId).lean()
      : null;

    const linkedUserIsValid =
      linkedUser &&
      [UserRole.RENTER, UserRole.GUEST].includes(linkedUser.role) &&
      (!linkedUser.organizationId || linkedUser.organizationId === organizationId);

    const tenant = await this.tenantModel.create({
      ...dto,
      userId: linkedUserIsValid ? String(linkedUser._id) : dto.userId ?? null,
      fullName: dto.fullName?.trim() || linkedUser?.fullName || 'Unknown tenant',
      email: dto.email?.trim()?.toLowerCase() || linkedUser?.email || 'unknown@example.com',
      phone: dto.phone?.trim() || linkedUser?.phoneNumber || 'unknown',
      monthlyRent: dto.monthlyRent ?? unit?.monthlyRent ?? null,
      organizationId,
      tenantKind: dto.tenantKind ?? TenantKind.RENTER,
      paymentRecords: [],
    });

    if (linkedUserIsValid) {
      const alreadyLinked =
        linkedUser.organizationIds?.includes(organizationId) &&
        linkedUser.ownerIds?.includes(ownerUserId) &&
        linkedUser.propertyIds?.includes(dto.propertyId);

      if (alreadyLinked) {
        await this.syncResidentUserLink(
          String(linkedUser._id),
          organizationId,
          ownerUserId,
          dto.propertyId,
        );
      } else {
        await this.ensurePendingResidentAssignmentRequest(
          organizationId,
          ownerUserId,
          String(linkedUser._id),
          linkedUser.email,
          dto.tenantKind ?? TenantKind.RENTER,
          dto.propertyId,
        );
      }
    }

    await this.syncUnitAssignment(organizationId, String(tenant._id), dto.unitId ?? null);
    return tenant;
  }

  async findAll(organizationId: string, query: QueryTenantDto): Promise<any> {
    const {
      page = 1,
      limit = 20,
      search,
      propertyId,
      unitId,
      tenantKind,
      paymentMonth,
      paidThisMonth,
      isActive,
    } = query;

    const filter: any = { organizationId };

    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (tenantKind) filter.tenantKind = tenantKind;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }

    const [data, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    let filteredData = data;
    if (paymentMonth && typeof paidThisMonth === 'boolean') {
      filteredData = data.filter((tenant: any) => {
        const payment = tenant.paymentRecords?.find((item: any) => item.monthKey === paymentMonth);
        const isPaid =
          payment?.status === TenantPaymentStatus.PAID ||
          (tenant.tenantKind === TenantKind.GUEST && tenant.guestFeePaid);
        return paidThisMonth ? isPaid : !isPaid;
      });
    }

    return {
      data: filteredData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(organizationId: string, id: string): Promise<any> {
    const tenant = await this.tenantModel
      .findOne({ _id: id, organizationId })
      .lean();

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findCurrentTenantProfile(
    organizationId: string,
    userId: string,
    email: string,
  ): Promise<any> {
    const user = await this.userModel
      .findOne({
        $or: [{ _id: userId }, { email }],
      })
      .lean();

    const tenant =
      (organizationId
        ? await this.tenantModel
            .findOne({
              organizationId,
              $or: [{ userId }, { email }],
            })
            .lean()
        : null) ??
      (await this.tenantModel
        .findOne({
          $or: [{ userId }, { email }],
        })
        .sort({ createdAt: -1 })
        .lean());

    if (!tenant) {
      return {
        tenant: null,
        property: null,
        unit: null,
        linkedOwner: null,
        pendingAssignment: null,
      };
    }

    const hasAcceptedResidentLink = user
      ? [UserRole.RENTER, UserRole.GUEST].includes(user.role) &&
        (user.organizationIds ?? []).includes(tenant.organizationId) &&
        (user.propertyIds ?? []).includes(String(tenant.propertyId))
      : false;

    if (!hasAcceptedResidentLink) {
      const pendingAssignment = await this.assignmentRequestModel
        .findOne({
          direction: AssignmentRequestDirection.OWNER_TO_USER,
          targetUserId: userId,
          requestedRole: tenant.tenantKind === TenantKind.GUEST ? UserRole.GUEST : UserRole.RENTER,
          propertyIds: { $in: [String(tenant.propertyId)] },
          status: AssignmentRequestStatus.PENDING,
        })
        .sort({ createdAt: -1 })
        .lean();
      const [linkedOwner, pendingOwner, pendingProperties] = await Promise.all([
        user?.activeOwnerId ? this.userModel.findById(String(user.activeOwnerId)).lean() : null,
        pendingAssignment?.ownerUserId ? this.userModel.findById(String(pendingAssignment.ownerUserId)).lean() : null,
        pendingAssignment?.propertyIds?.length
          ? this.propertyModel.find({ _id: { $in: pendingAssignment.propertyIds }, organizationId: tenant.organizationId }).lean()
          : [],
      ]);

      return {
        tenant: null,
        property: null,
        unit: null,
        linkedOwner,
        pendingAssignment: pendingAssignment
          ? {
              ...pendingAssignment,
              ownerUser: pendingOwner ?? null,
              properties: pendingProperties,
            }
          : null,
      };
    }

    const [property, unit, linkedOwner] = await Promise.all([
      tenant.propertyId
        ? this.propertyModel
            .findOne({ _id: tenant.propertyId, organizationId: tenant.organizationId })
            .lean()
        : null,
      tenant.unitId
        ? this.unitModel.findOne({ _id: tenant.unitId, organizationId: tenant.organizationId }).lean()
        : null,
      user?.activeOwnerId ? this.userModel.findById(String(user.activeOwnerId)).lean() : null,
    ]);

    return {
      tenant,
      property,
      unit,
      linkedOwner,
    };
  }

  async update(
    organizationId: string,
    ownerUserId: string,
    id: string,
    dto: UpdateTenantDto,
  ): Promise<any> {
    const currentTenant = await this.tenantModel.findOne({ _id: id, organizationId });
    if (!currentTenant) throw new NotFoundException('Tenant not found');

    const nextUnitId = dto.unitId !== undefined ? dto.unitId ?? null : currentTenant.unitId ?? null;
    const unit = nextUnitId
      ? await this.unitModel.findOne({ _id: nextUnitId, organizationId })
      : null;

    const updatePayload: Record<string, unknown> = { ...dto };
    if (dto.monthlyRent === undefined && dto.unitId !== undefined && currentTenant.tenantKind === TenantKind.RENTER) {
      updatePayload.monthlyRent = unit?.monthlyRent ?? currentTenant.monthlyRent ?? null;
    }

    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, organizationId },
      updatePayload,
      { new: true },
    );

    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.userId) {
      const linkedUser = await this.userModel.findById(String(tenant.userId)).lean();
      const alreadyLinked =
        linkedUser &&
        (linkedUser.organizationIds ?? []).includes(organizationId) &&
        (linkedUser.ownerIds ?? []).includes(ownerUserId);

      if (alreadyLinked) {
        await this.syncResidentUserLink(
          String(tenant.userId),
          organizationId,
          ownerUserId,
          String(tenant.propertyId),
        );
      } else if (linkedUser?.email) {
        await this.ensurePendingResidentAssignmentRequest(
          organizationId,
          ownerUserId,
          String(tenant.userId),
          linkedUser.email,
          tenant.tenantKind,
          String(tenant.propertyId),
        );
      }
    }
    if ((currentTenant.unitId ?? null) !== nextUnitId) {
      await this.syncUnitAssignment(organizationId, String(tenant._id), nextUnitId, currentTenant.unitId ?? null);
    }
    return tenant;
  }

  async leaveCurrentTenantProfile(
    organizationId: string,
    userId: string,
    email: string,
  ): Promise<any> {
    const tenant =
      (organizationId
        ? await this.tenantModel.findOne({
            organizationId,
            $or: [{ userId }, { email }],
          })
        : null) ??
      (await this.tenantModel.findOne({
        $or: [{ userId }, { email }],
      }).sort({ createdAt: -1 }));

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasPendingPaymentRecord = (tenant.paymentRecords ?? []).some(
      (item) => item.status !== TenantPaymentStatus.PAID,
    );
    const hasGuestFeeDue =
      tenant.tenantKind === TenantKind.GUEST &&
      Boolean(tenant.oneTimeGuestFee) &&
      !tenant.guestFeePaid;
    const openBillCount = await this.billModel.countDocuments({
      organizationId: tenant.organizationId,
      tenantId: String(tenant._id),
      status: { $in: [BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.OVERDUE] },
    });

    if (hasPendingPaymentRecord || hasGuestFeeDue || openBillCount > 0) {
      throw new BadRequestException('Outstanding dues found. Clear bills before leaving.');
    }

    const linkedUser = await this.userModel.findOne({
      $or: [{ _id: userId }, { email }],
    });

    tenant.userId = null;
    tenant.isActive = false;
    tenant.movedOutAt = tenant.movedOutAt ?? new Date();
    await tenant.save();

    if (linkedUser && [UserRole.RENTER, UserRole.GUEST].includes(linkedUser.role)) {
      linkedUser.organizationId =
        linkedUser.organizationId === tenant.organizationId ? null : linkedUser.organizationId;
      linkedUser.organizationIds = (linkedUser.organizationIds ?? []).filter(
        (item) => item !== tenant.organizationId,
      );
      linkedUser.ownerIds = [];
      linkedUser.activeOwnerId = null;
      linkedUser.propertyIds = (linkedUser.propertyIds ?? []).filter(
        (item) => item !== String(tenant.propertyId),
      );
      linkedUser.activePropertyId =
        linkedUser.activePropertyId === String(tenant.propertyId)
          ? null
          : linkedUser.activePropertyId ?? null;
      await linkedUser.save();
    }

    await this.syncUnitAssignment(
      tenant.organizationId,
      null,
      null,
      tenant.unitId ?? null,
    );

    return { left: true };
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const tenant = await this.tenantModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.syncUnitAssignment(organizationId, null, null, tenant.unitId ?? null);
    return { deleted: true };
  }

  async recordPayment(
    organizationId: string,
    id: string,
    dto: RecordTenantPaymentDto,
  ): Promise<any> {
    const tenant = await this.tenantModel.findOne({ _id: id, organizationId });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const fallbackDueDate = this.buildDueDate(dto.monthKey, tenant.rentDueDay ?? null);
    const existing = tenant.paymentRecords.find((item) => item.monthKey === dto.monthKey);

    if (existing) {
      existing.amount = dto.amount;
      existing.status = dto.status ?? TenantPaymentStatus.PAID;
      existing.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      existing.dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate ?? fallbackDueDate;
      existing.paymentMethod = dto.paymentMethod ?? existing.paymentMethod;
      existing.note = dto.note ?? existing.note;
    } else {
      tenant.paymentRecords.push({
        monthKey: dto.monthKey,
        amount: dto.amount,
        status: dto.status ?? TenantPaymentStatus.PAID,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : fallbackDueDate,
        paymentMethod: dto.paymentMethod ?? null,
        note: dto.note ?? null,
      } as any);
    }

    if (tenant.tenantKind === TenantKind.GUEST) {
      tenant.guestFeePaid = true;
    }

    await tenant.save();
    return tenant.toObject();
  }

  private async syncUnitAssignment(
    organizationId: string,
    tenantId: string | null,
    nextUnitId: string | null,
    previousUnitId?: string | null,
  ) {
    if (previousUnitId && previousUnitId !== nextUnitId) {
      await this.unitModel.findOneAndUpdate(
        { _id: previousUnitId, organizationId },
        { tenantId: null, status: 'vacant' },
      );
    }

    if (nextUnitId) {
      await this.unitModel.findOneAndUpdate(
        { _id: nextUnitId, organizationId },
        {
          tenantId,
          status: tenantId ? 'occupied' : 'vacant',
        },
      );
    }
  }

  private buildDueDate(monthKey?: string | null, dueDay?: number | null): Date | null {
    if (!monthKey || !dueDay) return null;
    const [yearString, monthString] = monthKey.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    if (!year || !month) return null;
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(Date.UTC(year, month - 1, Math.min(dueDay, lastDay)));
  }

  private async syncResidentUserLink(
    userId: string,
    organizationId: string,
    ownerUserId: string,
    propertyId?: string | null,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user || ![UserRole.RENTER, UserRole.GUEST].includes(user.role)) {
      return;
    }

    user.organizationId = organizationId;
    if (!user.organizationIds.includes(organizationId)) {
      user.organizationIds.push(organizationId);
    }

    user.ownerIds = ownerUserId ? [ownerUserId] : user.ownerIds;
    user.activeOwnerId = ownerUserId ?? user.activeOwnerId ?? null;
    user.propertyIds = propertyId ? [propertyId] : [];
    user.activePropertyId = propertyId ?? null;
    user.firstAddedByOwnerId = user.firstAddedByOwnerId ?? ownerUserId;

    await user.save();
  }

  private async ensurePendingResidentAssignmentRequest(
    organizationId: string,
    ownerUserId: string,
    targetUserId: string,
    targetEmail: string,
    tenantKind: TenantKind,
    propertyId: string,
  ) {
    const existingRequest = await this.assignmentRequestModel.findOne({
      direction: AssignmentRequestDirection.OWNER_TO_USER,
      ownerUserId,
      targetUserId,
      requestedRole: tenantKind === TenantKind.GUEST ? UserRole.GUEST : UserRole.RENTER,
      propertyIds: { $in: [propertyId] },
      status: AssignmentRequestStatus.PENDING,
    });

    if (existingRequest) {
      return;
    }

    await this.assignmentRequestModel.create({
      direction: AssignmentRequestDirection.OWNER_TO_USER,
      status: AssignmentRequestStatus.PENDING,
      requesterUserId: ownerUserId,
      requesterRole: UserRole.TETENTWONER,
      targetUserId,
      targetEmail,
      ownerUserId,
      organizationId,
      requestedRole: tenantKind === TenantKind.GUEST ? UserRole.GUEST : UserRole.RENTER,
      propertyIds: propertyId ? [propertyId] : [],
      message: 'Owner invited you to confirm property assignment.',
    });
  }
}
