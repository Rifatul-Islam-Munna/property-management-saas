import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum AiProviderKind {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
  OLLAMA = 'ollama',
}

export type AiProviderConfigDocument = HydratedDocument<AiProviderConfig>;

@Schema({ timestamps: true })
export class AiProviderConfig {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: AiProviderKind, example: AiProviderKind.OPENAI })
  @Prop({ type: String, enum: AiProviderKind, required: true, index: true })
  provider: AiProviderKind;

  @ApiProperty({ example: 'Resident helper - GPT' })
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @ApiPropertyOptional({ example: 'org_abc123' })
  @Prop({ type: String, default: null, index: true })
  organizationId?: string | null;

  @ApiProperty({ example: 'gpt-5' })
  @Prop({ type: String, required: true, trim: true })
  model: string;

  @ApiPropertyOptional({ example: 'https://api.openai.com' })
  @Prop({ type: String, default: null, trim: true })
  baseUrl?: string | null;

  @ApiPropertyOptional({ example: 'sk-live-...' })
  @Prop({ type: String, default: null, trim: true })
  apiKey?: string | null;

  @ApiPropertyOptional({ example: 'Resident support AI. Keep answers short.' })
  @Prop({ type: String, default: null })
  systemPrompt?: string | null;

  @ApiPropertyOptional({ example: 0.2 })
  @Prop({ type: Number, default: 0.2 })
  temperature?: number | null;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: true, index: true })
  enabled: boolean;

  @ApiPropertyOptional({ example: false })
  @Prop({ type: Boolean, default: false, index: true })
  isDefault: boolean;

  @ApiPropertyOptional({ example: { 'HTTP-Referer': 'https://example.com' } })
  @Prop({ type: Object, default: {} })
  headers: Record<string, string>;

  @ApiPropertyOptional({ example: { notes: 'future-safe metadata' } })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const AiProviderConfigSchema =
  SchemaFactory.createForClass(AiProviderConfig);

AiProviderConfigSchema.index({ organizationId: 1, enabled: 1, isDefault: -1 });
