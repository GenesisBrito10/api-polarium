import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DigitalService } from './digital.service.js';
import { BuyDigitalDto } from './dto/buy-digital.dto.js';
import { SdkService } from '../../sdk/sdk.service.js';

@Controller('trade/digital')
export class DigitalController {
  constructor(
    private readonly digitalService: DigitalService,
    private readonly sdkService: SdkService,
  ) {}

  @Post('buy')
  @HttpCode(HttpStatus.CREATED)
  async buyDigitalOption(@Body() buyDigitalDto: BuyDigitalDto) {
    const sdk = await this.sdkService.getSdk(buyDigitalDto.login, buyDigitalDto.password);
    const order = await this.digitalService.buyOption(sdk, buyDigitalDto);
    return { message: 'Digital option purchase initiated.', order };
  }
}