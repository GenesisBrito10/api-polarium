import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { DigitalController } from './digital/digital.controller.js';
import { DigitalService } from './digital/digital.service.js';
import { BinaryController } from './binary/binary.controller.js';
import { BinaryService } from './binary/binary.service.js';


@Module({
  imports: [SdkModule],
  controllers: [DigitalController, BinaryController],
  providers: [DigitalService, BinaryService],
})
export class TradingModule {}