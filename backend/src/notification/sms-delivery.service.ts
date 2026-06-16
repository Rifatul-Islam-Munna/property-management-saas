import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsDeliveryService {
  private readonly logger = new Logger(SmsDeliveryService.name);

  constructor(private readonly configService: ConfigService) {}

  sendFireAndForget(payload: { to: string; body: string }) {
    void this.send(payload);
  }

  private async send(payload: { to: string; body: string }) {
    const webhookUrl = this.configService.get<string>('SMS_WEBHOOK_URL');
    try {
      if (webhookUrl) {
        await axios.post(webhookUrl, payload);
        return;
      }
      this.logger.log(`SMS queued to ${payload.to}: ${payload.body.slice(0, 80)}`);
    } catch (error) {
      this.logger.error(`SMS failed to ${payload.to}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
