import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { UserRole } from 'src/user/entities/user.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkApprovalStatus, WorkOrder, WorkOrderDocument, WorkOrderStatus } from './entities/work-order.entity';

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectModel(WorkOrder.name)
    private readonly workOrderModel: Model<WorkOrderDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateWorkOrderDto) {
    const workOrder = await this.workOrderModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      updatedByUserId: actor.id,
      updatedByName: actor.fullName,
      updatedByRole: actor.role,
    });

    return workOrder.toObject();
  }

  async findAll(organizationId: string, actor: JwtUser, query: QueryWorkOrderDto) {
    const { page = 1, limit = 20, propertyId, assignedTo, status, fromDate, toDate } = query;
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER ? { assignedTo: actor.id } : { organizationId };

    if (propertyId) filter.propertyId = propertyId;
    if (assignedTo && actor.role !== UserRole.WORKER) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      if (toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.workOrderModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.workOrderModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(organizationId: string, actor: JwtUser, id: string) {
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };

    const workOrder = await this.workOrderModel.findOne(filter).lean();
    if (!workOrder) throw new NotFoundException('Work order not found');
    return workOrder;
  }

  async update(organizationId: string, actor: JwtUser, id: string, dto: UpdateWorkOrderDto) {
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };

    const updatePayload =
      actor.role === UserRole.WORKER
        ? {
            status: dto.status,
            actualCost: dto.actualCost,
            completionNotes: dto.completionNotes,
            completionProof: dto.completionProof,
            approvalStatus:
              dto.status === WorkOrderStatus.COMPLETED || dto.actualCost !== undefined || dto.completionProof?.length
                ? WorkApprovalStatus.PENDING
                : undefined,
            approvalRequestedAt:
              dto.status === WorkOrderStatus.COMPLETED || dto.actualCost !== undefined || dto.completionProof?.length
                ? new Date()
                : undefined,
          }
        : {
            ...dto,
            approvedBy: dto.approvalStatus === WorkApprovalStatus.APPROVED ? actor.id : undefined,
            approvedAt: dto.approvalStatus === WorkApprovalStatus.APPROVED ? new Date() : undefined,
            verifiedBy: dto.approvalStatus === WorkApprovalStatus.APPROVED ? actor.id : undefined,
            verifiedAt: dto.approvalStatus === WorkApprovalStatus.APPROVED ? new Date() : undefined,
            status: dto.approvalStatus === WorkApprovalStatus.APPROVED ? WorkOrderStatus.COMPLETED : dto.status,
          };

    const workOrder = await this.workOrderModel.findOneAndUpdate(
      filter,
      {
        ...updatePayload,
        updatedByUserId: actor.id,
        updatedByName: actor.fullName,
        updatedByRole: actor.role,
      },
      { new: true },
    );
    if (!workOrder) throw new NotFoundException('Work order not found');
    return workOrder.toObject();
  }

  async verify(organizationId: string, id: string, actor: JwtUser) {
    const workOrder = await this.workOrderModel.findOne({ _id: id, organizationId });
    if (!workOrder) throw new NotFoundException('Work order not found');
    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.approvalStatus = WorkApprovalStatus.APPROVED;
    workOrder.approvedBy = actor.id;
    workOrder.approvedAt = new Date();
    workOrder.verifiedBy = actor.id;
    workOrder.verifiedAt = new Date();
    workOrder.updatedByUserId = actor.id;
    workOrder.updatedByName = actor.fullName;
    workOrder.updatedByRole = actor.role;
    await workOrder.save();
    return workOrder.toObject();
  }

  async remove(organizationId: string, id: string) {
    const workOrder = await this.workOrderModel.findOneAndDelete({ _id: id, organizationId });
    if (!workOrder) throw new NotFoundException('Work order not found');
    return { deleted: true };
  }
}
