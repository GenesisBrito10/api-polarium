import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { ConfigModule } from '@nestjs/config';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [
    SdkModule,
    ConfigModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}