import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import type { Response } from 'express';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { SuccessResponseDto } from 'src/lib/success-response.dto';
import { UserRole } from 'src/user/entities/user.entity';
import { AiMcpService } from './ai-mcp.service';
import { AiMcpServerService } from './ai-mcp-server.service';
import { AiService } from './ai.service';
import { ChatWithAiDto } from './dto/chat-with-ai.dto';
import { CreateAiProviderConfigDto } from './dto/create-ai-provider-config.dto';
import { McpRpcDto } from './dto/mcp-rpc.dto';
import { QueryAiProviderConfigDto } from './dto/query-ai-provider-config.dto';
import { UpdateAiProviderConfigDto } from './dto/update-ai-provider-config.dto';

function buildAiRequestContext(req: ExpressRequest) {
  return {
    baseUrl: `${req.protocol}://${req.get('host')}`,
    authHeader:
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : typeof req.headers['access_token'] === 'string'
          ? `Bearer ${req.headers['access_token']}`
          : undefined,
  };
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiMcpService: AiMcpService,
    private readonly aiMcpServerService: AiMcpServerService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('providers')
  async listProviders(@Query() query: QueryAiProviderConfigDto) {
    const data = await this.aiService.listProviderConfigs(query);
    return new SuccessResponseDto(200, 'AI provider configs fetched', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('providers')
  async createProvider(@Body() dto: CreateAiProviderConfigDto) {
    const data = await this.aiService.createProviderConfig(dto);
    return new SuccessResponseDto(201, 'AI provider config created', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('providers/:id')
  async updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateAiProviderConfigDto,
  ) {
    const data = await this.aiService.updateProviderConfig(id, dto);
    return new SuccessResponseDto(200, 'AI provider config updated', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('providers/:id')
  async deleteProvider(@Param('id') id: string) {
    const data = await this.aiService.deleteProviderConfig(id);
    return new SuccessResponseDto(200, 'AI provider config deleted', data);
  }

  @Get('providers/current')
  async getCurrentProvider(@Req() req: ExpressRequest) {
    const data = await this.aiService.getCurrentProviderStatus(req.user);
    return new SuccessResponseDto(200, 'Current AI provider status fetched', data);
  }

  @Get('mcp/tools')
  async listMcpTools(@Req() req: ExpressRequest) {
    const data = {
      capabilities: this.aiMcpService.getCapabilities(),
      tools: this.aiMcpService.listTools(req.user),
    };
    return new SuccessResponseDto(200, 'MCP tools fetched', data);
  }

  @Post('mcp/rpc')
  async handleMcpRpc(@Req() req: ExpressRequest, @Body() dto: McpRpcDto) {
    if (dto.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: dto.id,
        result: {
          tools: this.aiMcpService.listTools(req.user),
        },
      };
    }

    if (dto.method === 'tools/call') {
      const name =
        typeof dto.params?.name === 'string' ? String(dto.params.name) : '';
      const args =
        dto.params?.arguments && typeof dto.params.arguments === 'object'
          ? (dto.params.arguments as Record<string, unknown>)
          : {};
      const result = await this.aiMcpService.callTool(req.user, name, args);
      return {
        jsonrpc: '2.0',
        id: dto.id,
        result,
      };
    }

    return {
      jsonrpc: '2.0',
      id: dto.id,
      error: {
        code: -32601,
        message: `Unsupported MCP method: ${dto.method}`,
      },
    };
  }

  @All('mcp')
  async handleOfficialMcp(
    @Req() req: ExpressRequest,
    @Res() res: Response,
    @Body() body?: unknown,
  ): Promise<void> {
    await this.aiMcpServerService.handleRequest(
      req.user,
      req,
      res,
      req.method === 'POST' ? body : undefined,
    );
  }

  @Roles(UserRole.RENTER, UserRole.GUEST)
  @Get('chat/resident/status')
  async getResidentChatStatus(@Req() req: ExpressRequest) {
    const data = await this.aiService.getCurrentProviderStatus(req.user);
    return new SuccessResponseDto(200, 'Resident AI status fetched', data);
  }

  @Roles(UserRole.RENTER, UserRole.GUEST)
  @Post('chat/resident')
  async chatWithResidentAi(
    @Req() req: ExpressRequest,
    @Body() dto: ChatWithAiDto,
  ) {
    const data = await this.aiService.runResidentChat(
      req.user,
      dto,
      buildAiRequestContext(req),
    );
    return new SuccessResponseDto(200, 'Resident AI response generated', data);
  }

  @Roles(UserRole.RENTER, UserRole.GUEST)
  @Delete('chat/resident/session/:sessionId')
  async clearResidentSession(
    @Req() req: ExpressRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const data = this.aiService.clearResidentSession(req.user, sessionId);
    return new SuccessResponseDto(200, 'Resident AI session cleared', data);
  }

  @Roles(UserRole.TETENTWONER)
  @Get('chat/owner/status')
  async getOwnerChatStatus(@Req() req: ExpressRequest) {
    const data = await this.aiService.getCurrentProviderStatus(req.user);
    return new SuccessResponseDto(200, 'Owner AI status fetched', data);
  }

  @Roles(UserRole.TETENTWONER)
  @Post('chat/owner')
  async chatWithOwnerAi(
    @Req() req: ExpressRequest,
    @Body() dto: ChatWithAiDto,
  ) {
    const data = await this.aiService.runRoleChat(
      req.user,
      dto,
      buildAiRequestContext(req),
    );
    return new SuccessResponseDto(200, 'Owner AI response generated', data);
  }

  @Roles(UserRole.TETENTWONER)
  @Delete('chat/owner/session/:sessionId')
  async clearOwnerSession(
    @Req() req: ExpressRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const data = this.aiService.clearRoleSession(req.user, sessionId);
    return new SuccessResponseDto(200, 'Owner AI session cleared', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('chat/admin/status')
  async getAdminChatStatus(@Req() req: ExpressRequest) {
    const data = await this.aiService.getCurrentProviderStatus(req.user);
    return new SuccessResponseDto(200, 'Admin AI status fetched', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('chat/admin')
  async chatWithAdminAi(
    @Req() req: ExpressRequest,
    @Body() dto: ChatWithAiDto,
  ) {
    const data = await this.aiService.runRoleChat(
      req.user,
      dto,
      buildAiRequestContext(req),
    );
    return new SuccessResponseDto(200, 'Admin AI response generated', data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('chat/admin/session/:sessionId')
  async clearAdminSession(
    @Req() req: ExpressRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const data = this.aiService.clearRoleSession(req.user, sessionId);
    return new SuccessResponseDto(200, 'Admin AI session cleared', data);
  }
}
