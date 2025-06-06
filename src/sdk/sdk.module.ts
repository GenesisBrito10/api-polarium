import { Module } from '@nestjs/common';
import { SdkService } from './sdk.service.js';
import { SdkController } from './sdk.controller.js';

@Module({
  providers: [SdkService],
  controllers: [SdkController],
  exports: [SdkService], 
})
export class SdkModule {}