import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [
    SdkModule,
    ConfigModule, // Make ConfigService available in OrderService
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}