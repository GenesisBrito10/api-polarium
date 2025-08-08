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
import { ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module.js';
import { CandlesModule } from './candles/candles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env'
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    SdkModule,
    TradingModule,
    AccountModule,
    OrderModule,
    WebhookModule,
    WebsocketModule,
    UserModule,
    CandlesModule,
  ],
  controllers: [AppController],
  providers: [Logger, AppService]
})
export class AppModule {}