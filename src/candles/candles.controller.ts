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

@Controller('candles')
export class CandlesController {
  constructor(
    private readonly candlesService: CandlesService,
    private readonly sdkService: SdkService,
  ) {}

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
}
