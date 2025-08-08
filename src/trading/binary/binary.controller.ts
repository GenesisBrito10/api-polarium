import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BinaryService } from './binary.service.js';
import { BuyBinaryDto } from './dto/buy-binary.dto.js';
import { SdkService } from '../../sdk/sdk.service.js';

@Controller('trade/binary')
export class BinaryController {
  constructor(
    private readonly binaryService: BinaryService,
    private readonly sdkService: SdkService,
  ) {}

  private readonly logger = new Logger(BinaryController.name);

  @Post('buy')
  @HttpCode(HttpStatus.CREATED)
  async buyBinaryOption(@Body() buyBinaryDto: BuyBinaryDto) {
    this.logger.log(`POST /trade/binary/buy - email: ${buyBinaryDto.email}`);
    const sdk = await this.sdkService.getSdk(
      buyBinaryDto.email,
      buyBinaryDto.password,
    );
    const order = await this.binaryService.buyOption(sdk, buyBinaryDto);
    this.logger.log(`Binary option order placed for ${buyBinaryDto.email}`);
    return { message: 'Binary option purchase initiated.', order };
  }
}
