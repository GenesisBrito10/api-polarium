
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CandlesService } from './candles.service.js';
import { GetCandlesDto } from './dto/get-candles.dto.js';
import { SdkService } from '../sdk/sdk.service.js';
import { SdkCredentialsDto } from '../sdk/dto/sdk-credentials.dto.js';

@Controller('candles')
export class CandlesController {
  constructor(
    private readonly candlesService: CandlesService,
    private readonly sdkService: SdkService,
  ) { }

  private readonly logger = new Logger(CandlesController.name);

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCandles(@Query() query: GetCandlesDto) {
    this.logger.log(
      `GET /candles - email: ${query.email}, pair: ${query.pair}`,
    );
    const sdk = await this.sdkService.getSdk(query.email, query.password);
    return this.candlesService.getCandles(sdk, query.pair, query.period);
  }
  @Get('digital')
  @HttpCode(HttpStatus.OK)
  async getDigitalActives(@Query() query: SdkCredentialsDto) {
    this.logger.log(`GET /candles/digital-actives - email: ${query.email}`);
    const sdk = await this.sdkService.getSdk(query.email, query.password);
    const digitalOptions = await sdk.digitalOptions();
    const availableOptions = digitalOptions
      .getUnderlyingsAvailableForTradingAt(new Date())
      .filter(active => !active.isSuspended)
      .map(active => ({ name: active.name, id: active.activeId }));
    return availableOptions;
  }

  @Get('binary')
  @HttpCode(HttpStatus.OK)
  async getBinaryActives(@Query() query: SdkCredentialsDto) {
    this.logger.log(`GET /candles/binary-actives - email: ${query.email}`);
    const sdk = await this.sdkService.getSdk(query.email, query.password);
    const ativo = await sdk.binaryOptions();
    const ativos = ativo
      .getActives()
      .filter(active => active.canBeBoughtAt(new Date()) && !active.isSuspended)
      .map(active => ({ name: active.ticker, id: active.id, payout: 100 - active.profitCommissionPercent }));
    return ativos;
  }
}
