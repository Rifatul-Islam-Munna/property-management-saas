import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailDeliveryService {
  private readonly logger = new Logger(MailDeliveryService.name);

  constructor(private readonly configService: ConfigService) {}

  sendFireAndForget(payload: { to: string; subject?: string | null; body: string }) {
    void this.send(payload);
  }

  private async send(payload: { to: string; subject?: string | null; body: string }) {
    const webhookUrl = this.configService.get<string>('MAIL_WEBHOOK_URL');
    try {
      if (webhookUrl) {
        await axios.post(webhookUrl, payload);
        return;
      }
      this.logger.log(`Mail queued to ${payload.to}: ${payload.subject ?? 'No subject'}`);
    } catch (error) {
      this.logger.error(`Mail failed to ${payload.to}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
