import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async record(input: {
    organizationId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    actor?: Partial<JwtUser> | null;
    metadata?: Record<string, any>;
  }) {
    if (!input.organizationId) return null;

    return this.auditLogModel.create({
      organizationId: input.organizationId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actorId: input.actor?.id ?? null,
      actorName: input.actor?.fullName ?? null,
      actorRole: input.actor?.role ?? null,
      metadata: input.metadata ?? {},
    });
  }

  async findAll(organizationId: string, query: { page?: number; limit?: number; entityType?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 30), 100);
    const filter: Record<string, unknown> = { organizationId };
    if (query.entityType) filter.entityType = query.entityType;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
