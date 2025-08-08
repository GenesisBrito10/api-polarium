import { Module } from '@nestjs/common';
import { CandlesController } from './candles.controller.js';
import { CandlesService } from './candles.service.js';
import { SdkModule } from '../sdk/sdk.module.js';

@Module({
  imports: [SdkModule],
  controllers: [CandlesController],
  providers: [CandlesService],
})
export class CandlesModule {}
