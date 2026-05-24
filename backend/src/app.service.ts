import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Property Operations Platform API',
      docs: '/api',
    };
  }
}
