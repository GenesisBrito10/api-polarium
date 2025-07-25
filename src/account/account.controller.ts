import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AccountService } from './account.service.js';
import { GetBalanceDto } from './dto/get-balance.dto.js';
import { SdkService } from '../sdk/sdk.service.js';

@Controller('account') // Route will be /api/balance
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly sdkService: SdkService,
  ) {}

  private readonly logger = new Logger(AccountController.name);

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  async getBalances(@Body() getBalanceDto: GetBalanceDto) {
    this.logger.log(`POST /account/balance - email: ${getBalanceDto.email}`);
    const sdk = await this.sdkService.getSdk(getBalanceDto.email, getBalanceDto.password);
    const balances = await this.accountService.getAccountBalances(sdk);
    this.logger.log(`Retrieved ${balances.length} balances for ${getBalanceDto.email}`);
    return { balances };
  }
}