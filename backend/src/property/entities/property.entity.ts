import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOTEL = 'hotel',
  VILLA = 'villa',
  OFFICE = 'office',
  COWORKING_SPACE = 'coworking_space',
  VACATION_RENTAL = 'vacation_rental',
}

@Schema({ _id: false })
export class Address {
  @ApiPropertyOptional({ example: '123 Main St' })
  @Prop({ type: String, trim: true, default: null })
  street?: string | null;

  @ApiPropertyOptional({ example: 'New York' })
  @Prop({ type: String, trim: true, default: null })
  city?: string | null;

  @ApiPropertyOptional({ example: 'NY' })
  @Prop({ type: String, trim: true, default: null })
  state?: string | null;

  @ApiPropertyOptional({ example: 'US' })
  @Prop({ type: String, trim: true, default: null })
  country?: string | null;

  @ApiPropertyOptional({ example: '10001' })
  @Prop({ type: String, trim: true, default: null })
  zipCode?: string | null;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ timestamps: true })
export class Property {
  @ApiProperty()
  _id: string;

  @ApiProperty({ example: 'org_abc123' })
  @Prop({ type: String, required: true, index: true })
  organizationId: string;

  @ApiProperty({ example: 'Sunset Apartments' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTMENT })
  @Prop({ type: String, enum: PropertyType, required: true })
  type: PropertyType;

  @ApiPropertyOptional({ type: Address })
  @Prop({ type: AddressSchema, default: () => ({}) })
  address: Address;

  @ApiPropertyOptional({ example: 'A beautiful apartment complex' })
  @Prop({ type: String, trim: true, default: null })
  description?: string | null;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/img1.jpg'] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiPropertyOptional({ example: ['https://cdn.example.com/doc1.pdf'] })
  @Prop({ type: [String], default: [] })
  documents: string[];

  @ApiPropertyOptional({ example: 50 })
  @Prop({ type: Number, default: 0 })
  totalUnits: number;

  @ApiPropertyOptional({ example: 5 })
  @Prop({ type: Number, default: 1 })
  totalFloors: number;

  @ApiPropertyOptional({ example: ['pool', 'gym', 'parking'] })
  @Prop({ type: [String], default: [] })
  amenities: string[];

  @ApiPropertyOptional({ example: '+1-555-0100' })
  @Prop({ type: String, trim: true, default: null })
  contactPhone?: string | null;

  @ApiPropertyOptional({ example: 'contact@sunset.com' })
  @Prop({ type: String, trim: true, default: null })
  contactEmail?: string | null;

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @Prop({ type: String, default: null })
  createdBy?: string | null;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ organizationId: 1, type: 1 });
PropertySchema.index({ organizationId: 1, isActive: 1 });
