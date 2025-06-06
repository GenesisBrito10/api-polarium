import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EventsGateway } from '../websocket/events.gateway.js';
import { TradeWebhookDto } from './dto/trade-webhook.dto.js';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly gateway: EventsGateway) {}

  @Post('trade')
  @HttpCode(HttpStatus.OK)
  handleTrade(@Body() dto: TradeWebhookDto) {
    this.gateway.emitTrade(dto);
    return { message: 'received' };
  }
}
