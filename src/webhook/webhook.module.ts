import { Module } from '@nestjs/common';
import { WebsocketModule } from '../websocket/websocket.module.js';
import { WebhookController } from './webhook.controller.js';

@Module({
  imports: [WebsocketModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
