import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Get() // Route will be /api/order?email=...&password=...&orderId=...
  @HttpCode(HttpStatus.OK)
  async getOrder(@Query() getOrderDto: GetOrderQueryDto) {
    const sdk = await this.sdkService.getSdk(getOrderDto.email, getOrderDto.password);
    const orderId = Number(getOrderDto.orderId);
    const orderDetails = await this.orderService.getOrderDetails(sdk, getOrderDto.email,orderId);
    return orderDetails; 
  }
  @Get('history') // Route will be /api/order/history?email=...&password=...&activeId=...
  @HttpCode(HttpStatus.OK)
  async getOrderHistory(@Query() getOrderDto: GetHistoryDto) {
    const sdk = await this.sdkService.getSdk(getOrderDto.email, getOrderDto.password);
    
    /* const orderHistory = await this.orderService.getOrderHistory(sdk);
    return orderHistory;  */
  }
}