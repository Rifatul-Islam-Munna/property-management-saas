import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { JwtUser } from 'src/lib/auth.guard';
import { TicketCategory, TicketPriority } from 'src/ticket/entities/ticket.entity';
import { UserRole } from 'src/user/entities/user.entity';
import { AiMcpService } from './ai-mcp.service';

type SessionRecord = {
  sessionId: string;
  userId: string;
  server: McpServer;
  transport: StreamableHTTPServerTransport;
};

@Injectable()
export class AiMcpServerService implements OnModuleDestroy {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly aiMcpService: AiMcpService) {}

  async handleRequest(
    actor: JwtUser,
    req: Request,
    res: Response,
    parsedBody?: unknown,
  ) {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId =
      typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

    if (sessionId) {
      const existing = this.sessions.get(sessionId);
      if (!existing || existing.userId !== actor.id) {
        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'MCP session not found',
          },
          id: null,
        });
        return;
      }

      await existing.transport.handleRequest(req, res, parsedBody);
      return;
    }

    if (req.method === 'POST' && isInitializeRequest(parsedBody)) {
      let transport!: StreamableHTTPServerTransport;
      const server = this.buildServer(actor, {
        baseUrl: `${req.protocol}://${req.get('host')}`,
        authHeader:
          typeof req.headers.authorization === 'string'
            ? req.headers.authorization
            : typeof req.headers['access_token'] === 'string'
              ? `Bearer ${req.headers['access_token']}`
              : undefined,
      });

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (nextSessionId) => {
          this.sessions.set(nextSessionId, {
            sessionId: nextSessionId,
            userId: actor.id,
            server,
            transport,
          });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          this.sessions.delete(transport.sessionId);
        }
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    throw new BadRequestException(
      'MCP initialize request required before using session endpoint',
    );
  }

  async onModuleDestroy() {
    for (const session of this.sessions.values()) {
      await session.transport.close();
      await session.server.close();
    }

    this.sessions.clear();
  }

  private buildServer(
    actor: JwtUser,
    context: {
      baseUrl: string;
      authHeader?: string;
    },
  ) {
    const server = new McpServer(
      {
        name: 'property-operations-platform-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          logging: {},
        },
      },
    );

    if ([UserRole.RENTER, UserRole.GUEST].includes(actor.role)) {
      server.registerResource(
        'resident-workspace-summary',
        'propertyops://resident/workspace-summary',
        {
          title: 'Resident Workspace Summary',
          description: 'Current resident property, unit, and tenant summary.',
          mimeType: 'application/json',
        },
        async () => {
          const result = await this.aiMcpService.callTool(
            actor,
            'resident_get_workspace_summary',
            {},
          );
          return {
            contents: [
              {
                uri: 'propertyops://resident/workspace-summary',
                text: JSON.stringify(result.structuredContent ?? {}, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        },
      );

      server.registerResource(
        'resident-billing-summary',
        'propertyops://resident/billing-summary',
        {
          title: 'Resident Billing Summary',
          description: 'Resident unpaid and recent bills summary.',
          mimeType: 'application/json',
        },
        async () => {
          const result = await this.aiMcpService.callTool(
            actor,
            'resident_get_billing_summary',
            {},
          );
          return {
            contents: [
              {
                uri: 'propertyops://resident/billing-summary',
                text: JSON.stringify(result.structuredContent ?? {}, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        },
      );

      server.registerPrompt(
        'resident-ticket-helper',
        {
          title: 'Resident Ticket Helper',
          description:
            'Guide model to collect facts before calling resident_create_ticket.',
          argsSchema: {
            issue: z.string(),
          },
        },
        ({ issue }) => ({
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help resident with issue: ${issue}. Ask for missing facts, then call resident_create_ticket when ready.`,
              },
            },
          ],
        }),
      );
    }

    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER].includes(
        actor.role,
      )
    ) {
      server.registerResource(
        'platform-route-scope',
        'propertyops://platform/route-scope',
        {
          title: 'Platform Route Scope',
          description: 'Role-scoped API route scope for MCP proxy tool.',
          mimeType: 'application/json',
        },
        async () => {
          const result = await this.aiMcpService.callTool(
            actor,
            'platform_list_routes',
            {},
            context,
          );
          return {
            contents: [
              {
                uri: 'propertyops://platform/route-scope',
                text: JSON.stringify(result.structuredContent ?? {}, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        },
      );
    }

    server.registerTool(
      'resident_get_workspace_summary',
      {
        title: 'Resident Workspace Summary',
        description:
          'Get active resident property, unit, tenant, and owner summary.',
        inputSchema: z.object({}),
      },
      async () => {
        return this.aiMcpService.callTool(
          actor,
          'resident_get_workspace_summary',
          {},
        );
      },
    );

    server.registerTool(
      'resident_list_open_tickets',
      {
        title: 'Resident Open Tickets',
        description:
          'List open resident-created tickets for current account.',
        inputSchema: z
          .object({
            limit: z.number().min(1).max(10).optional(),
          })
          .strict(),
      },
      async (args) => {
        return this.aiMcpService.callTool(
          actor,
          'resident_list_open_tickets',
          args,
        );
      },
    );

    server.registerTool(
      'resident_get_billing_summary',
      {
        title: 'Resident Billing Summary',
        description:
          'Get unpaid and recent billing summary for current resident.',
        inputSchema: z.object({}),
      },
      async () => {
        return this.aiMcpService.callTool(
          actor,
          'resident_get_billing_summary',
          {},
        );
      },
    );

    server.registerTool(
      'resident_list_notices',
      {
        title: 'Resident Notices',
        description: 'List recent active notices relevant to current resident.',
        inputSchema: z
          .object({
            limit: z.number().min(1).max(10).optional(),
          })
          .strict(),
      },
      async (args) => {
        return this.aiMcpService.callTool(
          actor,
          'resident_list_notices',
          args,
        );
      },
    );

    server.registerTool(
      'resident_create_ticket',
      {
        title: 'Resident Create Ticket',
        description:
          'Create maintenance/support ticket for current resident account.',
        inputSchema: z
          .object({
            title: z.string().min(1),
            description: z.string().min(1),
            category: z.nativeEnum(TicketCategory).optional(),
            priority: z.nativeEnum(TicketPriority).optional(),
            propertyId: z.string().optional(),
            unitId: z.string().optional(),
          })
          .strict(),
      },
      async (args) => {
        return this.aiMcpService.callTool(actor, 'resident_create_ticket', args);
      },
    );

    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER].includes(
        actor.role,
      )
    ) {
      server.registerTool(
        'platform_list_routes',
        {
          title: 'Platform Route Scope',
          description: 'List role-scoped API route prefixes available to this account.',
          inputSchema: z.object({}),
        },
        async () => {
          return this.aiMcpService.callTool(
            actor,
            'platform_list_routes',
            {},
            context,
          );
        },
      );

      server.registerTool(
        'platform_api_request',
        {
          title: 'Platform API Request',
          description:
            'Call a role-scoped platform API endpoint using same authenticated account.',
          inputSchema: z
            .object({
              method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
              path: z.string().min(1),
              query: z.record(z.string(), z.unknown()).optional(),
              body: z.record(z.string(), z.unknown()).optional(),
            })
            .strict(),
        },
        async (args) => {
          return this.aiMcpService.callTool(
            actor,
            'platform_api_request',
            args,
            context,
          );
        },
      );
    }

    return server;
  }
}
