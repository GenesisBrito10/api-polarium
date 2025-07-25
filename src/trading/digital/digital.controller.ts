import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { DigitalService } from './digital.service.js';
import { BuyDigitalDto } from './dto/buy-digital.dto.js';
import { SdkService } from '../../sdk/sdk.service.js';

@Controller('trade/digital')
export class DigitalController {
  constructor(
    private readonly digitalService: DigitalService,
    private readonly sdkService: SdkService,
  ) {}

  private readonly logger = new Logger(DigitalController.name);

  @Post('buy')
  @HttpCode(HttpStatus.CREATED)
  async buyDigitalOption(@Body() buyDigitalDto: BuyDigitalDto) {
    this.logger.log(`POST /trade/digital/buy - email: ${buyDigitalDto.email}`);
    const sdk = await this.sdkService.getSdk(buyDigitalDto.email, buyDigitalDto.password);
    const order = await this.digitalService.buyOption(sdk, buyDigitalDto);
    this.logger.log(`Digital option order placed for ${buyDigitalDto.email}`);
    return { message: 'Digital option purchase initiated.', order };
  }
}