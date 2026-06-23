import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/user/entities/user.entity';

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

export class StaffPaymentRecord {
  monthKey: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid';
  paidAt?: Date | null;
  financeEntryId?: string | null;
  note?: string | null;
}

export class StaffMessageRecord {
  subject?: string | null;
  body: string;
  channels: Array<'email' | 'sms'>;
  sentAt: Date;
  sentBy: string;
}

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @Prop({ type: String, required: true, index: true })
  propertyId: string;

  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  email?: string | null;

  @Prop({ type: String, trim: true, default: null })
  phone?: string | null;

  @Prop({ type: String, trim: true, required: true })
  role: string;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ type: String, default: null })
  workDescription?: string | null;

  @Prop({ type: Date, default: null })
  workStart?: Date | null;

  @Prop({ type: Date, default: null })
  workEnd?: Date | null;

  @Prop({ type: Number, default: 0 })
  monthlyPay?: number;

  @Prop({ type: String, default: 'USD' })
  currency?: string;

  @Prop({ type: String, enum: StaffStatus, default: StaffStatus.ACTIVE, index: true })
  status: StaffStatus;

  @Prop({
    type: [
      {
        monthKey: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        paidAt: { type: Date, default: null },
        financeEntryId: { type: String, default: null },
        note: { type: String, default: null },
      },
    ],
    default: [],
  })
  paymentRecords: StaffPaymentRecord[];

  @Prop({
    type: [
      {
        subject: { type: String, default: null },
        body: { type: String, required: true },
        channels: { type: [String], default: ['email'] },
        sentAt: { type: Date, default: Date.now },
        sentBy: { type: String, required: true },
      },
    ],
    default: [],
  })
  messages: StaffMessageRecord[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, default: null })
  updatedByUserId?: string | null;

  @Prop({ type: String, trim: true, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  updatedByRole?: UserRole | null;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
StaffSchema.index({ organizationId: 1, propertyId: 1 });
StaffSchema.index({ organizationId: 1, role: 1 });
