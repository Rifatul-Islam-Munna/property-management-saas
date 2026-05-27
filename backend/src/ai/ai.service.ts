import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { JwtUser } from 'src/lib/auth.guard';
import { Organization, OrganizationDocument } from 'src/organization/entities/organization.entity';
import { UserRole } from 'src/user/entities/user.entity';
import { ChatWithAiDto } from './dto/chat-with-ai.dto';
import {
  AiProviderConfig,
  AiProviderConfigDocument,
  AiProviderKind,
} from './entities/ai-provider-config.entity';
import { QueryAiProviderConfigDto } from './dto/query-ai-provider-config.dto';
import { CreateAiProviderConfigDto } from './dto/create-ai-provider-config.dto';
import { UpdateAiProviderConfigDto } from './dto/update-ai-provider-config.dto';
import { AiMcpService } from './ai-mcp.service';
import { AiSessionService } from './ai-session.service';

type ResolvedProvider = {
  id: string;
  name: string;
  provider: AiProviderKind;
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  systemPrompt?: string | null;
  temperature?: number | null;
  headers: Record<string, string>;
  organizationId?: string | null;
};

type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type PlannedToolCall = {
  name: string;
  arguments?: Record<string, unknown>;
};

type AiExecutionContext = {
  baseUrl?: string;
  authHeader?: string;
};

@Injectable()
export class AiService {
  constructor(
    @InjectModel(AiProviderConfig.name)
    private readonly aiProviderConfigModel: Model<AiProviderConfigDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly aiMcpService: AiMcpService,
    private readonly aiSessionService: AiSessionService,
  ) {}

  async listProviderConfigs(query: QueryAiProviderConfigDto) {
    const filter: Record<string, unknown> = {};
    if (query.provider) filter.provider = query.provider;
    if (query.organizationId) filter.organizationId = query.organizationId;
    if (query.enabled !== undefined) filter.enabled = query.enabled === 'true';

    const data = await this.aiProviderConfigModel
      .find(filter)
      .sort({ organizationId: -1, isDefault: -1, createdAt: -1 })
      .lean();

    return data.map((item) => this.toProviderResponse(item));
  }

  async createProviderConfig(dto: CreateAiProviderConfigDto) {
    await this.ensureOrganizationIfProvided(dto.organizationId);
    if (dto.isDefault) {
      await this.clearDefaultFlag(dto.organizationId ?? null);
    }

    const created = await this.aiProviderConfigModel.create({
      provider: dto.provider,
      name: dto.name.trim(),
      organizationId: dto.organizationId?.trim() || null,
      model: dto.model.trim(),
      baseUrl: dto.baseUrl?.trim() || null,
      apiKey: dto.apiKey?.trim() || null,
      systemPrompt: dto.systemPrompt?.trim() || null,
      temperature: dto.temperature ?? 0.2,
      enabled: dto.enabled ?? true,
      isDefault: dto.isDefault ?? false,
      headers: dto.headers ?? {},
      metadata: dto.metadata ?? {},
    });

    return this.toProviderResponse(created.toObject());
  }

  async updateProviderConfig(id: string, dto: UpdateAiProviderConfigDto) {
    const current = await this.aiProviderConfigModel.findById(id);
    if (!current) throw new NotFoundException('AI provider config not found');

    const nextOrganizationId =
      dto.organizationId !== undefined
        ? dto.organizationId?.trim() || null
        : current.organizationId ?? null;

    await this.ensureOrganizationIfProvided(nextOrganizationId ?? undefined);

    if (dto.isDefault) {
      await this.clearDefaultFlag(nextOrganizationId ?? null, id);
    }

    const updated = await this.aiProviderConfigModel
      .findByIdAndUpdate(
        id,
        {
          provider: dto.provider ?? current.provider,
          name: dto.name?.trim() || current.name,
          organizationId: nextOrganizationId,
          model: dto.model?.trim() || current.get('model'),
          baseUrl:
            dto.baseUrl !== undefined
              ? dto.baseUrl?.trim() || null
              : current.baseUrl ?? null,
          apiKey:
            dto.apiKey !== undefined
              ? dto.apiKey?.trim() || null
              : current.apiKey ?? null,
          systemPrompt:
            dto.systemPrompt !== undefined
              ? dto.systemPrompt?.trim() || null
              : current.systemPrompt ?? null,
          temperature: dto.temperature ?? current.temperature ?? 0.2,
          enabled: dto.enabled ?? current.enabled,
          isDefault: dto.isDefault ?? current.isDefault,
          headers: dto.headers ?? current.headers ?? {},
          metadata: dto.metadata ?? current.metadata ?? {},
        },
        { new: true, lean: true },
      );

    if (!updated) {
      throw new NotFoundException('AI provider config not found');
    }

    return this.toProviderResponse(updated);
  }

  async deleteProviderConfig(id: string) {
    const deleted = await this.aiProviderConfigModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('AI provider config not found');
    return { deleted: true };
  }

  async getCurrentProviderStatus(actor: JwtUser) {
    const config = await this.resolveProviderForUser(actor);
    return {
      configured: Boolean(config),
      provider: config?.provider ?? null,
      providerName: config?.name ?? null,
      model: config?.model ?? null,
      organizationId: actor.organizationId ?? null,
      sessionMode: 'ephemeral_memory_only',
      toolCount: this.aiMcpService.listTools(actor).length,
    };
  }

  async runResidentChat(
    actor: JwtUser,
    dto: ChatWithAiDto,
    context?: AiExecutionContext,
  ) {
    return this.runRoleChat(actor, dto, context);
  }

  async runRoleChat(
    actor: JwtUser,
    dto: ChatWithAiDto,
    context?: AiExecutionContext,
  ) {
    const requiresOrganizationScope = ![
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ].includes(actor.role);

    if (requiresOrganizationScope && !actor.organizationId) {
      throw new BadRequestException('Organization missing');
    }

    const config = await this.resolveProviderForUser(actor);
    if (!config) {
      throw new NotFoundException(
        'No enabled AI provider config found for this organization',
      );
    }

    const session = this.aiSessionService.getOrCreateSession(
      actor.id,
      actor.organizationId ?? '__global_admin__',
      dto.sessionId,
    );

    this.aiSessionService.appendMessage(
      actor.id,
      actor.organizationId ?? '__global_admin__',
      session.sessionId,
      {
        role: 'user',
        content: dto.message.trim(),
      },
    );

    const toolEvents: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
      isError: boolean;
    }> = [];

    let assistantReply = '';
    for (let round = 0; round < 2; round += 1) {
      const modelPlan = await this.requestModelPlan(
        actor,
        config,
        session.messages,
        toolEvents,
      );

      const plannedCalls = modelPlan.toolCalls.slice(0, 2);
      if (!plannedCalls.length) {
        assistantReply = modelPlan.reply || 'No response generated.';
        break;
      }

      for (const toolCall of plannedCalls) {
        const result = await this.aiMcpService.callTool(
          actor,
          toolCall.name,
          toolCall.arguments ?? {},
          context,
        );
        toolEvents.push({
          name: toolCall.name,
          arguments: toolCall.arguments ?? {},
          result: result.structuredContent ?? null,
          isError: Boolean(result.isError),
        });
        this.aiSessionService.appendMessage(
          actor.id,
          actor.organizationId ?? '__global_admin__',
          session.sessionId,
          {
            role: 'tool',
            content: JSON.stringify(
              {
                name: toolCall.name,
                arguments: toolCall.arguments ?? {},
                result: result.structuredContent ?? null,
                isError: Boolean(result.isError),
              },
              null,
              2,
            ),
          },
        );
      }

      const finalPlan = await this.requestModelFinalReply(
        actor,
        config,
        session.messages,
        toolEvents,
      );
      assistantReply = finalPlan.reply || 'Done.';
      break;
    }

    this.aiSessionService.appendMessage(
      actor.id,
      actor.organizationId ?? '__global_admin__',
      session.sessionId,
      {
        role: 'assistant',
        content: assistantReply,
      },
    );

    return {
      sessionId: session.sessionId,
      reply: assistantReply,
      provider: {
        id: config.id,
        name: config.name,
        provider: config.provider,
        model: config.model,
      },
      toolEvents,
      memoryPolicy: 'ephemeral_only',
    };
  }

  clearResidentSession(actor: JwtUser, sessionId: string) {
    if (
      !actor.organizationId &&
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)
    ) {
      throw new BadRequestException('Resident organization missing');
    }

    return {
      cleared: this.aiSessionService.clearSession(
        actor.id,
        actor.organizationId ?? '__global_admin__',
        sessionId,
      ),
    };
  }

  clearRoleSession(actor: JwtUser, sessionId: string) {
    return this.clearResidentSession(actor, sessionId);
  }

  private async requestModelPlan(
    actor: JwtUser,
    config: ResolvedProvider,
    messages: ChatMessage[],
    toolEvents: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
      isError: boolean;
    }>,
  ) {
    const tools = this.aiMcpService.listTools(actor);
    const prompt = [
      `You are resident support AI for property operations platform.`,
      `Memory policy: ephemeral only. Never mention saving conversation.`,
      `Available tools JSON: ${JSON.stringify(tools)}`,
      `Conversation JSON: ${JSON.stringify(messages)}`,
      `Executed tool events JSON: ${JSON.stringify(toolEvents)}`,
      `Return strict JSON only with shape {"reply":"string","toolCalls":[{"name":"string","arguments":{}}]}.`,
      `Use toolCalls only when tool needed.`,
      `Respect role scope. Admin can use platform_api_request for broad platform actions. Tenant owner can use platform_api_request only inside owner-safe routes.`,
      `For ticket creation or write actions, collect enough facts first. Keep reply concise.`,
    ].join('\n');

    const raw = await this.callProvider(config, [
      { role: 'user', content: prompt },
    ]);
    return this.parseModelReply(raw);
  }

  private async requestModelFinalReply(
    actor: JwtUser,
    config: ResolvedProvider,
    messages: ChatMessage[],
    toolEvents: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
      isError: boolean;
    }>,
  ) {
    const prompt = [
      `You are resident support AI for property operations platform.`,
      `Conversation JSON: ${JSON.stringify(messages)}`,
      `Tool events JSON: ${JSON.stringify(toolEvents)}`,
      `Return strict JSON only with shape {"reply":"string","toolCalls":[]}.`,
      `Summarize tool result for resident. If ticket created, mention ticket created.`,
      `Keep reply short, clear, action-focused.`,
    ].join('\n');

    const raw = await this.callProvider(config, [
      { role: 'user', content: prompt },
    ]);
    return this.parseModelReply(raw);
  }

  private async callProvider(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ): Promise<string> {
    switch (config.provider) {
      case AiProviderKind.OPENAI:
        return this.callOpenAi(config, messages);
      case AiProviderKind.ANTHROPIC:
        return this.callAnthropic(config, messages);
      case AiProviderKind.GEMINI:
        return this.callGemini(config, messages);
      case AiProviderKind.OPENROUTER:
        return this.callOpenRouter(config, messages);
      case AiProviderKind.OLLAMA:
        return this.callOllama(config, messages);
      default:
        throw new BadRequestException(`Unsupported provider: ${config.provider}`);
    }
  }

  private async callOpenAi(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ) {
    if (!config.apiKey) {
      throw new BadRequestException('OpenAI apiKey missing');
    }

    const response = await axios.post(
      `${config.baseUrl || 'https://api.openai.com'}/v1/responses`,
      {
        model: config.model,
        input: messages.map((message) => `${message.role}: ${message.content}`).join('\n'),
        instructions: config.systemPrompt ?? 'Property operations resident AI.',
        temperature: config.temperature ?? 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers,
        },
      },
    );

    const data = response.data ?? {};
    if (typeof data.output_text === 'string' && data.output_text.trim()) {
      return data.output_text;
    }

    const text = Array.isArray(data.output)
      ? data.output
          .flatMap((item: any) => item?.content ?? [])
          .map((item: any) => item?.text ?? '')
          .join('\n')
      : '';

    return text || JSON.stringify(data);
  }

  private async callAnthropic(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ) {
    if (!config.apiKey) {
      throw new BadRequestException('Anthropic apiKey missing');
    }

    const response = await axios.post(
      `${config.baseUrl || 'https://api.anthropic.com'}/v1/messages`,
      {
        model: config.model,
        max_tokens: 1200,
        temperature: config.temperature ?? 0.2,
        system: config.systemPrompt ?? 'Property operations resident AI.',
        messages: messages
          .filter((message) => message.role !== 'system')
          .map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
          })),
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          ...config.headers,
        },
      },
    );

    return (response.data?.content ?? [])
      .map((item: any) => item?.text ?? '')
      .join('\n');
  }

  private async callGemini(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ) {
    if (!config.apiKey) {
      throw new BadRequestException('Gemini apiKey missing');
    }

    const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com';
    const model = encodeURIComponent(config.model);
    const response = await axios.post(
      `${baseUrl}/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
      {
        systemInstruction: config.systemPrompt
          ? {
              parts: [{ text: config.systemPrompt }],
            }
          : undefined,
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: config.temperature ?? 0.2,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      },
    );

    return (
      response.data?.candidates?.[0]?.content?.parts
        ?.map((item: any) => item?.text ?? '')
        .join('\n') ?? ''
    );
  }

  private async callOpenRouter(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ) {
    if (!config.apiKey) {
      throw new BadRequestException('OpenRouter apiKey missing');
    }

    const response = await axios.post(
      `${config.baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        model: config.model,
        temperature: config.temperature ?? 0.2,
        messages: [
          ...(config.systemPrompt
            ? [{ role: 'system', content: config.systemPrompt }]
            : []),
          ...messages.map((message) => ({
            role: message.role === 'tool' ? 'user' : message.role,
            content: message.content,
          })),
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers,
        },
      },
    );

    return response.data?.choices?.[0]?.message?.content ?? '';
  }

  private async callOllama(
    config: ResolvedProvider,
    messages: ChatMessage[],
  ) {
    const response = await axios.post(
      `${config.baseUrl || 'http://localhost:11434'}/api/chat`,
      {
        model: config.model,
        stream: false,
        messages: [
          ...(config.systemPrompt
            ? [{ role: 'system', content: config.systemPrompt }]
            : []),
          ...messages,
        ],
        options: {
          temperature: config.temperature ?? 0.2,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey
            ? { Authorization: `Bearer ${config.apiKey}` }
            : {}),
          ...config.headers,
        },
      },
    );

    return response.data?.message?.content ?? response.data?.response ?? '';
  }

  private parseModelReply(raw: string) {
    const extracted = this.extractJsonObject(raw);
    const parsed = JSON.parse(extracted) as {
      reply?: string;
      toolCalls?: PlannedToolCall[];
    };

    return {
      reply: parsed.reply?.trim() || '',
      toolCalls: Array.isArray(parsed.toolCalls)
        ? parsed.toolCalls
            .filter((item) => item && typeof item.name === 'string')
            .map((item) => ({
              name: item.name,
              arguments:
                item.arguments && typeof item.arguments === 'object'
                  ? item.arguments
                  : {},
            }))
        : [],
    };
  }

  private extractJsonObject(raw: string) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start < 0 || end < 0 || end <= start) {
      throw new BadRequestException('AI response JSON parse failed');
    }

    return raw.slice(start, end + 1);
  }

  private async resolveProviderForUser(
    actor: JwtUser,
  ): Promise<ResolvedProvider | null> {
    const organizationId = actor.organizationId ?? null;
    const isAdminLike = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role);
    const candidates = await this.aiProviderConfigModel
      .find(
        isAdminLike
          ? {
              enabled: true,
            }
          : {
              enabled: true,
              $or: [{ organizationId }, { organizationId: null }],
            },
      )
      .sort({ organizationId: -1, isDefault: -1, createdAt: -1 })
      .lean();

    const selected = candidates[0];
    if (!selected) return null;

    return {
      id: String(selected._id),
      name: selected.name,
      provider: selected.provider,
      model: selected.model,
      baseUrl: selected.baseUrl ?? null,
      apiKey: selected.apiKey ?? null,
      systemPrompt: selected.systemPrompt ?? null,
      temperature: selected.temperature ?? 0.2,
      headers: selected.headers ?? {},
      organizationId: selected.organizationId ?? null,
    };
  }

  private async clearDefaultFlag(organizationId: string | null, excludeId?: string) {
    await this.aiProviderConfigModel.updateMany(
      {
        organizationId,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );
  }

  private async ensureOrganizationIfProvided(organizationId?: string | null) {
    if (!organizationId) return;

    const exists = await this.organizationModel
      .findById(organizationId)
      .select({ _id: 1 })
      .lean();

    if (!exists) {
      throw new NotFoundException('Organization not found for AI provider config');
    }
  }

  private toProviderResponse(item: any) {
    const apiKey = item.apiKey ? String(item.apiKey) : '';
    return {
      id: String(item._id),
      provider: item.provider,
      name: item.name,
      organizationId: item.organizationId ?? null,
      model: item.model,
      baseUrl: item.baseUrl ?? null,
      hasApiKey: Boolean(apiKey),
      maskedApiKey: apiKey ? this.maskSecret(apiKey) : null,
      systemPrompt: item.systemPrompt ?? null,
      temperature: item.temperature ?? 0.2,
      enabled: Boolean(item.enabled),
      isDefault: Boolean(item.isDefault),
      headers: item.headers ?? {},
      metadata: item.metadata ?? {},
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
    };
  }

  private maskSecret(value: string) {
    const trimmed = value.trim();
    if (trimmed.length <= 8) return trimmed;
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
  }
}
