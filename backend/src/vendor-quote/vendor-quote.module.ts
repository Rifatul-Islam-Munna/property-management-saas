import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorQuote, VendorQuoteSchema } from './entities/vendor-quote.entity';
import { VendorQuoteController } from './vendor-quote.controller';
import { VendorQuoteService } from './vendor-quote.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VendorQuote.name, schema: VendorQuoteSchema }]),
  ],
  controllers: [VendorQuoteController],
  providers: [VendorQuoteService],
  exports: [VendorQuoteService],
})
export class VendorQuoteModule {}
