import { Body, Controller, HttpCode, HttpStatus, Post, Logger } from '@nestjs/common';
import { EventsGateway } from '../websocket/events.gateway.js';
import { TradeWebhookDto } from './dto/trade-webhook.dto.js';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly gateway: EventsGateway) {}

  private readonly logger = new Logger(WebhookController.name);

  @Post('trade')
  @HttpCode(HttpStatus.OK)
  handleTrade(@Body() dto: TradeWebhookDto) {
    this.logger.log('POST /webhook/trade');
    this.gateway.emitTrade(dto);
    this.logger.log('Trade event emitted to WebSocket clients');
    return { message: 'received' };
  }
}
