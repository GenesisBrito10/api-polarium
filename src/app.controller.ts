import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private readonly logger = new Logger(AppController.name);

  @Get()
  getHello(): string {
    this.logger.log('GET /');
    const greeting = this.appService.getHello();
    this.logger.log('Responding with greeting');
    return greeting;
  }
}
