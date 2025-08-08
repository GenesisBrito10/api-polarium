import { Controller, Get, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { GetOrderQueryDto } from './dto/get-order.dto.js';
import { SdkService } from '../sdk/sdk.service.js';
import { GetHistoryDto } from './dto/get-history.dto.js';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly sdkService: SdkService,
  ) {}

  private readonly logger = new Logger(OrderController.name);

  @Get() // Route will be /api/order?email=...&password=...&orderId=...
  @HttpCode(HttpStatus.OK)
  async getOrder(@Query() getOrderDto: GetOrderQueryDto) {
    this.logger.log(`GET /order - email: ${getOrderDto.email}, orderId: ${getOrderDto.orderId}`);
    const sdk = await this.sdkService.getSdk(getOrderDto.email, getOrderDto.password);
    const orderId = Number(getOrderDto.orderId);
    const orderDetails = await this.orderService.getOrderDetails(sdk, getOrderDto.email,orderId, getOrderDto.uniqueId, getOrderDto.collection);
    this.logger.log(`Fetched order details for ${getOrderDto.email} - ${orderId}`);
    return orderDetails;
  }
  @Get('history') // Route will be /api/order/history?email=...&password=...&activeId=...
  @HttpCode(HttpStatus.OK)
  async getOrderHistory(@Query() getOrderDto: GetHistoryDto) {
    this.logger.log(`GET /order/history - email: ${getOrderDto.email}`);
    const orderHistory = await this.orderService.getOrderHistory(getOrderDto.email, getOrderDto.collection);
    this.logger.log(`Retrieved order history for ${getOrderDto.email}`);
    return orderHistory;
  }
}