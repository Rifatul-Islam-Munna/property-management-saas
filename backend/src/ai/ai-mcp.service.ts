import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { JwtUser } from 'src/lib/auth.guard';
import {
  Announcement,
  AnnouncementDocument,
  AnnouncementType,
  NoticeAudience,
} from 'src/announcement/entities/announcement.entity';
import {
  Bill,
  BillDocument,
  BillStatus,
} from 'src/bill/entities/bill.entity';
import {
  Property,
  PropertyDocument,
} from 'src/property/entities/property.entity';
import {
  Tenant,
  TenantDocument,
} from 'src/tenant/entities/tenant.entity';
import {
  CreateTicketDto,
} from 'src/ticket/dto/create-ticket.dto';
import {
  Ticket,
  TicketCategory,
  TicketDocument,
  TicketPriority,
  TicketStatus,
} from 'src/ticket/entities/ticket.entity';
import { TicketService } from 'src/ticket/ticket.service';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { UserRole } from 'src/user/entities/user.entity';

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  roles: UserRole[];
};

type ToolRequestContext = {
  baseUrl?: string;
  authHeader?: string;
};

@Injectable()
export class AiMcpService {
  private readonly tools: ToolDefinition[] = [
    {
      name: 'resident_get_workspace_summary',
      description: 'Get active resident property, unit, tenant, and owner summary.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      roles: [UserRole.RENTER, UserRole.GUEST],
    },
    {
      name: 'resident_list_open_tickets',
      description: 'List open resident-created tickets for current account.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 10 },
        },
      },
      roles: [UserRole.RENTER, UserRole.GUEST],
    },
    {
      name: 'resident_get_billing_summary',
      description: 'Get unpaid and recent billing summary for current resident.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      roles: [UserRole.RENTER, UserRole.GUEST],
    },
    {
      name: 'resident_list_notices',
      description: 'List recent active notices relevant to current resident.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 10 },
        },
      },
      roles: [UserRole.RENTER, UserRole.GUEST],
    },
    {
      name: 'resident_create_ticket',
      description: 'Create maintenance/support ticket for current resident account.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: Object.values(TicketCategory),
          },
          priority: {
            type: 'string',
            enum: Object.values(TicketPriority),
          },
          propertyId: { type: 'string' },
          unitId: { type: 'string' },
        },
        required: ['title', 'description'],
      },
      roles: [UserRole.RENTER, UserRole.GUEST],
    },
    {
      name: 'platform_list_routes',
      description:
        'List role-scoped platform API routes available to this account.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER],
    },
    {
      name: 'platform_api_request',
      description:
        'Call a role-scoped platform API endpoint with method, path, query, and body.',
      inputSchema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PATCH', 'DELETE'],
          },
          path: { type: 'string' },
          query: { type: 'object' },
          body: { type: 'object' },
        },
        required: ['method', 'path'],
      },
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER],
    },
  ];

  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
    @InjectModel(Bill.name)
    private readonly billModel: Model<BillDocument>,
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly ticketService: TicketService,
  ) {}

  getCapabilities() {
    return {
      tools: {
        listChanged: false,
      },
    };
  }

  listTools(actor: JwtUser) {
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
      return this.tools;
    }

    return this.tools.filter((tool) => tool.roles.includes(actor.role));
  }

  async callTool(
    actor: JwtUser,
    name: string,
    args: Record<string, unknown> = {},
    context?: ToolRequestContext,
  ) {
    const tool = this.tools.find((item) => item.name === name);

    const canBypassRoleCheck = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
      actor.role,
    );

    if (!tool || (!tool.roles.includes(actor.role) && !canBypassRoleCheck)) {
      return this.wrapToolError(`Tool not available: ${name}`);
    }

    try {
      switch (name) {
        case 'resident_get_workspace_summary':
          return this.wrapToolSuccess(await this.getWorkspaceSummary(actor));
        case 'resident_list_open_tickets':
          return this.wrapToolSuccess(await this.listOpenTickets(actor, args));
        case 'resident_get_billing_summary':
          return this.wrapToolSuccess(await this.getBillingSummary(actor));
        case 'resident_list_notices':
          return this.wrapToolSuccess(await this.listNotices(actor, args));
        case 'resident_create_ticket':
          return this.wrapToolSuccess(await this.createResidentTicket(actor, args));
        case 'platform_list_routes':
          return this.wrapToolSuccess(this.listRoleRoutes(actor));
        case 'platform_api_request':
          return this.wrapToolSuccess(
            await this.callPlatformApi(actor, args, context),
          );
        default:
          return this.wrapToolError(`Tool handler missing: ${name}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tool execution failed';
      return this.wrapToolError(message);
    }
  }

  private async getWorkspaceSummary(actor: JwtUser) {
    const tenant = await this.findResidentTenant(actor);
    const [property, unit] = await Promise.all([
      tenant.propertyId
        ? this.propertyModel
            .findOne({
              _id: tenant.propertyId,
              organizationId: actor.organizationId,
            })
            .lean()
        : null,
      tenant.unitId
        ? this.unitModel
            .findOne({
              _id: tenant.unitId,
              organizationId: actor.organizationId,
            })
            .lean()
        : null,
    ]);

    return {
      tenant: {
        id: String(tenant._id),
        fullName: tenant.fullName,
        kind: tenant.tenantKind,
        email: tenant.email,
        phone: tenant.phone,
      },
      property: property
        ? {
            id: String(property._id),
            name: property.name,
            type: property.type,
            address: property.address,
            contactEmail: property.contactEmail ?? null,
            contactPhone: property.contactPhone ?? null,
          }
        : null,
      unit: unit
        ? {
            id: String(unit._id),
            unitNumber: unit.unitNumber,
            floor: unit.floor,
            monthlyRent: unit.monthlyRent,
          }
        : null,
    };
  }

  private async listOpenTickets(actor: JwtUser, args: Record<string, unknown>) {
    const limit = this.numberInRange(args.limit, 5, 1, 10);
    const tickets = await this.ticketModel
      .find({
        organizationId: actor.organizationId,
        createdBy: actor.id,
        status: { $nin: [TicketStatus.COMPLETED, TicketStatus.CANCELLED] },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return tickets.map((ticket) => ({
      id: String(ticket._id),
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      propertyId: ticket.propertyId,
      unitId: ticket.unitId ?? null,
      createdAt: ticket['createdAt'] ?? null,
    }));
  }

  private async getBillingSummary(actor: JwtUser) {
    const tenant = await this.findResidentTenant(actor);
    const bills = await this.billModel
      .find({
        organizationId: actor.organizationId,
        tenantId: String(tenant._id),
      })
      .sort({ dueDate: -1, createdAt: -1 })
      .limit(12)
      .lean();

    const unpaid = bills.filter((bill) =>
      [BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.OVERDUE].includes(
        bill.status,
      ),
    );

    return {
      totalBills: bills.length,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((sum, bill) => sum + (bill.amount ?? 0), 0),
      latest: bills.slice(0, 5).map((bill) => ({
        id: String(bill._id),
        title: bill.title,
        amount: bill.amount,
        currency: bill.currency ?? 'USD',
        status: bill.status,
        dueDate: bill.dueDate ?? null,
        monthKey: bill.monthKey ?? null,
      })),
    };
  }

  private async listNotices(actor: JwtUser, args: Record<string, unknown>) {
    const tenant = await this.findResidentTenant(actor);
    const limit = this.numberInRange(args.limit, 5, 1, 10);
    const notices = await this.announcementModel
      .find({
        organizationId: actor.organizationId,
        isActive: true,
        $or: [
          { propertyId: null },
          { propertyId: String(tenant.propertyId) },
        ],
        $and: [
          {
            $or: [
              { audience: NoticeAudience.ALL },
              {
                audience: NoticeAudience.ROLE_BASED,
                targetRoles: { $in: [actor.role] },
              },
              {
                audience: NoticeAudience.USER_BASED,
                targetUserIds: { $in: [actor.id] },
              },
            ],
          },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notices.map((notice) => ({
      id: String(notice._id),
      title: notice.title,
      type: notice.type ?? AnnouncementType.GENERAL,
      content: notice.content,
      priority: notice.priority,
      scheduledAt: notice.scheduledAt ?? null,
      createdAt: notice['createdAt'] ?? null,
    }));
  }

  private async createResidentTicket(
    actor: JwtUser,
    args: Record<string, unknown>,
  ) {
    const tenant = await this.findResidentTenant(actor);
    const propertyId = this.readString(args.propertyId) ?? String(tenant.propertyId);
    const unitId = this.readString(args.unitId) ?? (tenant.unitId ? String(tenant.unitId) : undefined);
    const title = this.readRequiredString(args.title, 'Ticket title required');
    const description = this.readRequiredString(
      args.description,
      'Ticket description required',
    );
    const categoryValue = this.readString(args.category);
    const priorityValue = this.readString(args.priority);
    const category = Object.values(TicketCategory).includes(
      (categoryValue as TicketCategory) ?? TicketCategory.GENERAL,
    )
      ? ((categoryValue as TicketCategory) ?? TicketCategory.GENERAL)
      : TicketCategory.GENERAL;
    const priority = Object.values(TicketPriority).includes(
      (priorityValue as TicketPriority) ?? TicketPriority.MEDIUM,
    )
      ? ((priorityValue as TicketPriority) ?? TicketPriority.MEDIUM)
      : TicketPriority.MEDIUM;

    const payload: CreateTicketDto = {
      propertyId,
      unitId,
      tenantId: String(tenant._id),
      title,
      description,
      category,
      priority,
    };

    const created = await this.ticketService.create(
      actor.organizationId ?? '',
      actor,
      payload,
    );

    return {
      created: true,
      ticket: {
        id: created._id ?? created.id ?? null,
        title: created.title,
        status: created.status,
        priority: created.priority,
        category: created.category,
      },
    };
  }

  private listRoleRoutes(actor: JwtUser) {
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
      return {
        scope: 'admin_full_platform',
        notes: [
          'Admin MCP can call almost all platform endpoints.',
          'Avoid auth recursion routes like /ai/mcp and login/refresh/logout paths.',
        ],
        allowedPrefixes: ['/organization', '/user', '/property', '/unit', '/tenant', '/ticket', '/technician', '/announcement', '/bill', '/finance-entry', '/inspection', '/recurring-maintenance', '/vendor', '/work-order', '/analytics', '/subscription'],
      };
    }

    if (actor.role === UserRole.TETENTWONER) {
      return {
        scope: 'tenant_owner_operations',
        notes: [
          'Tenant owner MCP can manage organization-scoped operations only.',
          'Write actions stay limited to owner routes already allowed by backend role guards.',
        ],
        allowedPrefixes: ['/organization/my', '/user', '/property', '/unit', '/tenant', '/ticket', '/technician', '/announcement', '/bill', '/finance-entry', '/inspection', '/recurring-maintenance', '/vendor', '/work-order', '/analytics', '/messaging'],
      };
    }

    return {
      scope: 'resident_limited',
      allowedPrefixes: [],
    };
  }

  private async callPlatformApi(
    actor: JwtUser,
    args: Record<string, unknown>,
    context?: ToolRequestContext,
  ) {
    const method = this.readRequiredString(args.method, 'Request method required')
      .toUpperCase();
    const path = this.readRequiredString(args.path, 'Request path required');
    const query =
      args.query && typeof args.query === 'object'
        ? (args.query as Record<string, unknown>)
        : undefined;
    const body =
      args.body && typeof args.body === 'object'
        ? (args.body as Record<string, unknown>)
        : undefined;

    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
      throw new BadRequestException('Unsupported request method');
    }

    this.assertPathAllowed(actor, path);

    if (!context?.baseUrl) {
      throw new BadRequestException('Platform API base URL missing in MCP session');
    }

    const response = await axios.request({
      method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
      url: `${context.baseUrl}${path}`,
      params: query,
      data: body,
      headers: {
        ...(context.authHeader ? { Authorization: context.authHeader } : {}),
      },
    });

    return {
      method,
      path,
      status: response.status,
      data: response.data,
    };
  }

  private async findResidentTenant(actor: JwtUser) {
    const tenant = await this.tenantModel
      .findOne({
        organizationId: actor.organizationId,
        $or: [{ userId: actor.id }, { email: actor.email }],
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!tenant) {
      throw new NotFoundException('Resident tenant profile not found');
    }

    return tenant;
  }

  private wrapToolSuccess(data: unknown) {
    const structuredContent = this.toStructuredContent(data);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
      structuredContent,
      isError: false,
    };
  }

  private wrapToolError(message: string) {
    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
      structuredContent: {
        error: message,
      },
      isError: true,
    };
  }

  private toStructuredContent(data: unknown): Record<string, unknown> {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }

    return {
      value: data,
    };
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readRequiredString(value: unknown, message: string) {
    const normalized = this.readString(value);
    if (!normalized) {
      throw new BadRequestException(message);
    }
    return normalized;
  }

  private numberInRange(
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ) {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) return fallback;
    return Math.max(min, Math.min(max, numeric));
  }

  private assertPathAllowed(actor: JwtUser, path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const blockedPrefixes = ['/ai/mcp', '/ai/chat', '/user/login', '/user/refresh', '/user/logout'];

    if (blockedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
      throw new BadRequestException(`Path blocked for MCP proxy: ${normalizedPath}`);
    }

    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
      return;
    }

    if (actor.role === UserRole.TETENTWONER) {
      const allowedPrefixes = [
        '/organization/my',
        '/user',
        '/property',
        '/unit',
        '/tenant',
        '/ticket',
        '/technician',
        '/announcement',
        '/bill',
        '/finance-entry',
        '/inspection',
        '/recurring-maintenance',
        '/vendor',
        '/work-order',
        '/analytics',
        '/messaging',
      ];

      if (allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
        return;
      }
    }

    throw new BadRequestException(
      `Path not allowed for role ${actor.role}: ${normalizedPath}`,
    );
  }
}
