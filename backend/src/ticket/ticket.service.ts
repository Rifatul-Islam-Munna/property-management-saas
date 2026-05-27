import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  Ticket,
  TicketDocument,
  TicketStatus,
} from './entities/ticket.entity';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
  ) {}

  async create(organizationId: string, actor: JwtUser, dto: CreateTicketDto) {
    const ticket = await this.ticketModel.create({
      ...dto,
      organizationId,
      createdBy: actor.id,
      timeline: [
        {
          action: 'created',
          performedBy: actor.id,
          performedAt: new Date(),
          details: 'Ticket created',
        },
      ],
    });

    return this.enrichTicket(ticket.toObject());
  }

  async findAll(organizationId: string, actor: JwtUser, query: QueryTicketDto) {
    const {
      page = 1,
      limit = 20,
      search,
      propertyId,
      assignedTo,
      status,
      priority,
      category,
      fromDate,
      toDate,
    } = query;
    const filter: Record<string, unknown> =
      actor.role === UserRole.WORKER ? { assignedTo: actor.id } : { organizationId };

    if (actor.role === UserRole.RENTER || actor.role === UserRole.GUEST) {
      filter.createdBy = actor.id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (propertyId) filter.propertyId = propertyId;
    if (assignedTo && actor.role !== UserRole.WORKER) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      if (toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return {
      data: await this.enrichTickets(data),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(organizationId: string, actor: JwtUser, id: string) {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const ticket = await this.ticketModel.findOne(filter).lean();

    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertActorCanAccess(ticket, actor);

    return this.enrichTicket(ticket);
  }

  async update(organizationId: string, id: string, actor: JwtUser, dto: UpdateTicketDto) {
    const filter =
      actor.role === UserRole.WORKER
        ? { _id: id, assignedTo: actor.id }
        : { _id: id, organizationId };
    const existing = await this.ticketModel.findOne(filter);

    if (!existing) throw new NotFoundException('Ticket not found');
    this.assertActorCanAccess(existing.toObject(), actor);

    const updatePayload =
      actor.role === UserRole.WORKER
        ? {
            status: dto.status,
            actualCost: dto.actualCost,
            completionNotes: dto.completionNotes,
            completionProof: dto.completionProof,
          }
        : dto;

    const sanitizedPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([, value]) => value !== undefined),
    );

    if (sanitizedPayload.status === TicketStatus.COMPLETED && !existing.resolvedAt) {
      existing.resolvedAt = new Date();
    }

    Object.assign(existing, sanitizedPayload);
    existing.timeline.push({
      action: 'updated',
      performedBy: actor.id,
      performedAt: new Date(),
      details: 'Ticket updated',
    });
    await existing.save();

    return this.enrichTicket(existing.toObject());
  }

  async assign(
    organizationId: string,
    id: string,
    actor: JwtUser,
    assignedTo: string,
  ) {
    const ticket = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.assignedTo = assignedTo;
    ticket.status = TicketStatus.ASSIGNED;
    ticket.timeline.push({
      action: 'assigned',
      performedBy: actor.id,
      performedAt: new Date(),
      details: `Assigned to ${assignedTo}`,
    });
    await ticket.save();

    return this.enrichTicket(ticket.toObject());
  }

  async addComment(
    organizationId: string,
    id: string,
    actor: JwtUser,
    dto: AddCommentDto,
  ) {
    const ticket = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertActorCanAccess(ticket.toObject(), actor);

    ticket.comments.push({
      userId: actor.id,
      userName: actor.email,
      content: dto.content,
      createdAt: new Date(),
    });
    ticket.timeline.push({
      action: 'comment_added',
      performedBy: actor.id,
      performedAt: new Date(),
      details: 'Comment added',
    });
    await ticket.save();

    return this.enrichTicket(ticket.toObject());
  }

  async addInternalNote(
    organizationId: string,
    id: string,
    actor: JwtUser,
    dto: AddCommentDto,
  ) {
    const ticket = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertActorCanAccess(ticket.toObject(), actor);

    ticket.internalNotes.push({
      userId: actor.id,
      userName: actor.email,
      content: dto.content,
      createdAt: new Date(),
    });
    ticket.timeline.push({
      action: 'internal_note_added',
      performedBy: actor.id,
      performedAt: new Date(),
      details: 'Internal note added',
    });
    await ticket.save();

    return this.enrichTicket(ticket.toObject());
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.ticketModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!deleted) throw new NotFoundException('Ticket not found');

    return { deleted: true };
  }

  private assertActorCanAccess(
    ticket: { assignedTo?: string | null; createdBy: string },
    actor: JwtUser,
  ) {
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER].includes(actor.role)) {
      return;
    }

    if (actor.role === UserRole.WORKER && ticket.assignedTo === actor.id) {
      return;
    }

    if ([UserRole.RENTER, UserRole.GUEST].includes(actor.role) && ticket.createdBy === actor.id) {
      return;
    }

    throw new NotFoundException('Ticket not found');
  }

  private async enrichTickets<T extends { propertyId?: string; unitId?: string | null }>(
    tickets: T[],
  ) {
    if (!tickets.length) return tickets;

    const propertyIds = [...new Set(tickets.map((ticket) => ticket.propertyId).filter(Boolean))] as string[];
    const unitIds = [...new Set(tickets.map((ticket) => ticket.unitId).filter(Boolean))] as string[];

    const [properties, units] = await Promise.all([
      propertyIds.length
        ? this.propertyModel.find({ _id: { $in: propertyIds } }).select({ _id: 1, name: 1 }).lean()
        : [],
      unitIds.length
        ? this.unitModel.find({ _id: { $in: unitIds } }).select({ _id: 1, unitNumber: 1 }).lean()
        : [],
    ]);

    const propertyMap = new Map<string, string | null>(
      properties.map((property) => [String(property._id), property.name] as const),
    );
    const unitMap = new Map<string, string | null>(
      units.map((unit) => [String(unit._id), unit.unitNumber] as const),
    );

    return tickets.map((ticket) => ({
      ...ticket,
      propertyName: ticket.propertyId ? propertyMap.get(ticket.propertyId) ?? null : null,
      unitNumber: ticket.unitId ? unitMap.get(ticket.unitId) ?? null : null,
    }));
  }

  private async enrichTicket<T extends { propertyId?: string; unitId?: string | null }>(ticket: T) {
    const [enriched] = await this.enrichTickets([ticket]);
    return enriched;
  }
}
