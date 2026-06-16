import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit() {
    void this.run();
    setInterval(() => void this.run(), 60 * 60 * 1000);
  }

  private async run() {
    try {
      const result = await this.notificationService.runOverdueRentNotices();
      if (result.queued) {
        this.logger.log(`Overdue rent notices queued: ${result.queued}`);
      }
    } catch (error) {
      this.logger.error('Overdue rent notice scheduler failed', error instanceof Error ? error.stack : undefined);
    }
  }
}
