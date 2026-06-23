import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { MailDeliveryService } from 'src/notification/mail-delivery.service';
import { VendorQuote, VendorQuoteSchema } from './entities/vendor-quote.entity';
import { VendorQuoteRequest, VendorQuoteRequestSchema } from './entities/vendor-quote-request.entity';
import { VendorQuoteController } from './vendor-quote.controller';
import { VendorQuotePublicController } from './vendor-quote-public.controller';
import { VendorQuoteService } from './vendor-quote.service';

@Module({
  imports: [
    AuditLogModule,
    MongooseModule.forFeature([
      { name: VendorQuote.name, schema: VendorQuoteSchema },
      { name: VendorQuoteRequest.name, schema: VendorQuoteRequestSchema },
    ]),
  ],
  controllers: [VendorQuoteController, VendorQuotePublicController],
  providers: [VendorQuoteService, MailDeliveryService],
  exports: [VendorQuoteService],
})
export class VendorQuoteModule {}
