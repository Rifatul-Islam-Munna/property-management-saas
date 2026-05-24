import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { JwtUser } from 'src/lib/auth.guard';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  Ticket,
  TicketDocument,
  TicketStatus,
} from './entities/ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
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

    return ticket.toObject();
  }

  async findAll(organizationId: string, query: QueryTicketDto) {
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
    const filter: Record<string, unknown> = { organizationId };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (propertyId) filter.propertyId = propertyId;
    if (assignedTo) filter.assignedTo = assignedTo;
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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(organizationId: string, id: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, organizationId })
      .lean();

    if (!ticket) throw new NotFoundException('Ticket not found');

    return ticket;
  }

  async update(organizationId: string, id: string, actor: JwtUser, dto: UpdateTicketDto) {
    const existing = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!existing) throw new NotFoundException('Ticket not found');

    if (dto.status === TicketStatus.COMPLETED && !existing.resolvedAt) {
      existing.resolvedAt = new Date();
    }

    Object.assign(existing, dto);
    existing.timeline.push({
      action: 'updated',
      performedBy: actor.id,
      performedAt: new Date(),
      details: 'Ticket updated',
    });
    await existing.save();

    return existing.toObject();
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

    return ticket.toObject();
  }

  async addComment(
    organizationId: string,
    id: string,
    actor: JwtUser,
    dto: AddCommentDto,
  ) {
    const ticket = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!ticket) throw new NotFoundException('Ticket not found');

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

    return ticket.toObject();
  }

  async addInternalNote(
    organizationId: string,
    id: string,
    actor: JwtUser,
    dto: AddCommentDto,
  ) {
    const ticket = await this.ticketModel.findOne({ _id: id, organizationId });

    if (!ticket) throw new NotFoundException('Ticket not found');

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

    return ticket.toObject();
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.ticketModel.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!deleted) throw new NotFoundException('Ticket not found');

    return { deleted: true };
  }
}
