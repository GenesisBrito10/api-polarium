import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js'; // Import AppService
import { SdkModule } from './sdk/sdk.module.js';
import { TradingModule } from './trading/trading.module.js';
import { AccountModule } from './account/account.module.js';
import { OrderModule } from './order/order.module.js';
import { WebhookModule } from './webhook/webhook.module.js';
import { WebsocketModule } from './websocket/websocket.module.js';
import configuration from './config/configuration.js'; // Adjust the path as necessary

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      load: [configuration], // Load custom configuration
    }),
    MongooseModule.forRoot('mongodb://automagroup:3nWLOXv168Bg@177.93.108.140:27018/?authSource=admin'),
    SdkModule,
    TradingModule,
    AccountModule,
    OrderModule,
    WebhookModule,
    WebsocketModule,
    
  ],
  controllers: [AppController],
  providers: [Logger, AppService], // Add AppService to providers
})
export class AppModule {}