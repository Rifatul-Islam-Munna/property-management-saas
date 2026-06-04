import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Model } from 'mongoose';
import { extname } from 'path';
import { MinioService } from 'src/lib/minio.service';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Tenant, TenantDocument } from 'src/tenant/entities/tenant.entity';
import { Unit, UnitDocument } from 'src/unit/entities/unit.entity';
import { User, UserDocument } from 'src/user/entities/user.entity';

type TemplateContext = {
  user: UserDocument | null;
  tenant: TenantDocument | null;
  property: PropertyDocument | null;
  unit: UnitDocument | null;
};

@Injectable()
export class DocumentTemplateService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Unit.name)
    private readonly unitModel: Model<UnitDocument>,
    private readonly minioService: MinioService,
  ) {}

  async buildVariables(organizationId: string, recipientId: string, actor: { fullName: string; email: string }) {
    const user = await this.userModel.findById(recipientId).lean();
    if (!user) {
      throw new NotFoundException('Recipient user not found');
    }

    const tenant =
      (await this.tenantModel.findOne({
        organizationId,
        $or: [{ userId: recipientId }, { email: user.email }],
      }).lean()) ?? null;

    const property =
      tenant?.propertyId
        ? await this.propertyModel.findOne({ _id: tenant.propertyId, organizationId }).lean()
        : null;

    const unit =
      tenant?.unitId
        ? await this.unitModel.findOne({ _id: tenant.unitId, organizationId }).lean()
        : null;

    const today = new Date();

    return {
      owner_name: actor.fullName ?? '',
      owner_email: actor.email ?? '',
      current_date: today.toISOString().slice(0, 10),
      current_year: String(today.getUTCFullYear()),
      tenant_full_name: tenant?.fullName ?? user.fullName ?? '',
      tenant_email: tenant?.email ?? user.email ?? '',
      tenant_phone: tenant?.phone ?? user.phoneNumber ?? '',
      tenant_kind: tenant?.tenantKind ?? user.role ?? '',
      tenant_address: tenant?.address ?? '',
      tenant_lease_start: tenant?.leaseStart ? new Date(tenant.leaseStart).toISOString().slice(0, 10) : '',
      tenant_lease_end: tenant?.leaseEnd ? new Date(tenant.leaseEnd).toISOString().slice(0, 10) : '',
      tenant_monthly_rent: tenant?.monthlyRent != null ? String(tenant.monthlyRent) : '',
      tenant_security_deposit: tenant?.securityDeposit != null ? String(tenant.securityDeposit) : '',
      tenant_guest_fee: tenant?.oneTimeGuestFee != null ? String(tenant.oneTimeGuestFee) : '',
      property_name: property?.name ?? '',
      property_type: property?.type ?? '',
      property_address:
        [property?.address?.street, property?.address?.city, property?.address?.state, property?.address?.country, property?.address?.zipCode]
          .filter(Boolean)
          .join(', ') ?? '',
      property_contact_email: property?.contactEmail ?? '',
      property_contact_phone: property?.contactPhone ?? '',
      unit_number: unit?.unitNumber ?? '',
      unit_floor: unit?.floor != null ? String(unit.floor) : '',
      unit_type: unit?.type ?? '',
    };
  }

  replaceTextVariables(content: string | undefined | null, variables: Record<string, string>) {
    if (!content) return '';

    return content.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
      return variables[key] ?? '';
    });
  }

  async renderTemplateToFile(args: {
    sourceUrl?: string;
    htmlContent?: string;
    variables: Record<string, string>;
    recipientId: string;
    title?: string;
  }) {
    const fileBase = (args.title || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'document';

    if (args.htmlContent?.trim()) {
      const html = this.replaceTextVariables(args.htmlContent, args.variables);
      const buffer = Buffer.from(html, 'utf-8');
      const key = `generated-documents/${Date.now()}-${args.recipientId}-${fileBase}.html`;
      return this.minioService.uploadBuffer(buffer, key, 'text/html');
    }

    if (!args.sourceUrl) {
      return null;
    }

    const response = await axios.get<ArrayBuffer>(args.sourceUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);
    const urlPath = new URL(args.sourceUrl).pathname;
    const extension = extname(urlPath).toLowerCase();
    const mimeType = String(response.headers['content-type'] ?? 'application/octet-stream').split(';')[0];

    if (extension === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true,
      });
      doc.render(args.variables);
      const out = doc.getZip().generate({ type: 'nodebuffer' });
      const key = `generated-documents/${Date.now()}-${args.recipientId}-${fileBase}.docx`;
      return this.minioService.uploadBuffer(
        out,
        key,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    }

    if (extension === '.txt' || extension === '.html' || extension === '.htm' || mimeType.startsWith('text/')) {
      const sourceText = buffer.toString('utf-8');
      const rendered = this.replaceTextVariables(sourceText, args.variables);
      const nextExtension = extension || '.txt';
      const nextMime = nextExtension === '.html' || nextExtension === '.htm' ? 'text/html' : 'text/plain';
      const key = `generated-documents/${Date.now()}-${args.recipientId}-${fileBase}${nextExtension}`;
      return this.minioService.uploadBuffer(Buffer.from(rendered, 'utf-8'), key, nextMime);
    }

    return args.sourceUrl;
  }
}
