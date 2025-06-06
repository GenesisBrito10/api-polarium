import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AccountService } from './account.service.js';
import { GetBalanceDto } from './dto/get-balance.dto.js';
import { SdkService } from '../sdk/sdk.service.js';

@Controller('account') // Route will be /api/balance
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly sdkService: SdkService,
  ) {}

  @Post('balance') 
  @HttpCode(HttpStatus.OK)
  async getBalances(@Body() getBalanceDto: GetBalanceDto) {
    const sdk = await this.sdkService.getSdk(getBalanceDto.email, getBalanceDto.password);
    const balances = await this.accountService.getAccountBalances(sdk);
    return { balances };
  }
}