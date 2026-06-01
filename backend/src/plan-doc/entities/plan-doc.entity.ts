import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export type PlanDocDocument = HydratedDocument<PlanDoc>;

export enum PlanDocAccess {
  VIEW = 'view',
  EDIT = 'edit',
}

@Schema({ _id: false })
export class PlanViewport {
  @Prop({ type: Number, default: 0 })
  x: number;

  @Prop({ type: Number, default: 0 })
  y: number;

  @Prop({ type: Number, default: 1 })
  zoom: number;
}

@Schema({ _id: false, strict: false })
export class PlanFlowNode {
  @Prop({ type: String, required: true })
  id: string;
}

@Schema({ _id: false, strict: false })
export class PlanFlowEdge {
  @Prop({ type: String, required: true })
  id: string;
}

@Schema({ _id: false })
export class PlanShare {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, trim: true, default: null })
  fullName?: string | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  email?: string | null;

  @Prop({ type: String, enum: PlanDocAccess, default: PlanDocAccess.VIEW })
  access: PlanDocAccess;
}

@Schema({ timestamps: true })
export class PlanDoc {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  title: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: String, required: true, index: true })
  createdByUserId: string;

  @Prop({ type: String, trim: true, required: true })
  createdByName: string;

  @Prop({ type: String, enum: UserRole, required: true })
  createdByRole: UserRole;

  @Prop({ type: [PlanFlowNode], default: [] })
  nodes: PlanFlowNode[];

  @Prop({ type: [PlanFlowEdge], default: [] })
  edges: PlanFlowEdge[];

  @Prop({ type: PlanViewport, default: () => ({ x: 0, y: 0, zoom: 1 }) })
  viewport: PlanViewport;

  @Prop({ type: [PlanShare], default: [] })
  sharedWith: PlanShare[];

  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const PlanDocSchema = SchemaFactory.createForClass(PlanDoc);
PlanDocSchema.index({ organizationId: 1, createdByUserId: 1, updatedAt: -1 });
PlanDocSchema.index({ organizationId: 1, 'sharedWith.userId': 1, updatedAt: -1 });
