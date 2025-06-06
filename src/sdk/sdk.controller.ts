import { Controller, Post, Delete, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { SdkService } from './sdk.service.js';
import { SdkCredentialsDto } from './dto/sdk-credentials.dto.js';
import { StopSdkDto } from './dto/stop-sdk.dto.js';

@Controller('sdk')
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startSdk(@Body() sdkCredentialsDto: SdkCredentialsDto) {
    await this.sdkService.getSdk(sdkCredentialsDto.email, sdkCredentialsDto.password);
    return { message: 'SDK initialized or retrieved successfully.' };
  }

  @Delete('stop')
  @HttpCode(HttpStatus.OK)
  async stopSdk(@Body() stopSdkDto: StopSdkDto) {
    const removed = this.sdkService.removeSdkFromCache(stopSdkDto.email);
    if (!removed) {
      throw new NotFoundException(`SDK not found in cache for login "${stopSdkDto.email}".`);
    }
    return { message: 'SDK removed from cache successfully.' };
  }
}