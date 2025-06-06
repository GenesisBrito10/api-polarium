import { Module } from '@nestjs/common';
import { SdkModule } from '../sdk/sdk.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [SdkModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}