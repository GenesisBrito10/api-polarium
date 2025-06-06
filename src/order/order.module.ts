import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { OrderResult, OrderResultSchema } from './schemas/order-result.schema.js';

@Module({
  imports: [
    SdkModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: OrderResult.name, schema: OrderResultSchema }]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}