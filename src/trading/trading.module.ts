import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { DigitalController } from './digital/digital.controller.js';
import { DigitalService } from './digital/digital.service.js';


@Module({
  imports: [SdkModule],
  controllers: [DigitalController],
  providers: [DigitalService],
})
export class TradingModule {}