import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ClientSdk as ClientSdkType } from '@quadcode-tech/client-sdk-js';
import { mapTradeDirection } from '../utils/map-direction.util.js';
import { BuyDigitalDto } from './dto/buy-digital.dto.js';
import { AccountType as AppAccountType } from '../../shared/enums/account-type.enum.js';

@Injectable()
export class DigitalService {
  private readonly logger = new Logger(DigitalService.name);
  private readonly preloadMap = new WeakMap<ClientSdkType, Promise<void>>();


  private async ensurePreloaded(sdk: ClientSdkType): Promise<void> {
    let preload = this.preloadMap.get(sdk);
    if (!preload) {
      preload = this.preloadDigitalOptions(sdk);
      this.preloadMap.set(sdk, preload);
    }
    return preload;
  }

  private async preloadDigitalOptions(sdk: ClientSdkType): Promise<void> {
    try {
      const digitalOptions = await sdk.digitalOptions();
      const underlyings = digitalOptions.getUnderlyingsAvailableForTradingAt(
        new Date(),
      );
      await Promise.all(
        underlyings.map(async (underlying) => {
          try {
            await underlying.instruments();
          } catch (error) {
            this.logger.warn(
              `Failed to preload instruments for ${underlying.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to preload digital options cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async buyOption(
    sdk: ClientSdkType,
    buyDigitalDto: BuyDigitalDto,
  ): Promise<any> {
    const {
      assetName,
      operationValue,
      direction,
      account_type,
      period,
    } = buyDigitalDto;


    this.logger.log(
      `Attempting to buy digital option for asset "${assetName}", value: ${operationValue}, direction: ${direction}, account: ${account_type}, period: ${period}`,
    );

    try {
      const { BalanceType, DigitalOptionsDirection } = await import(
        '@quadcode-tech/client-sdk-js'
      );

      await this.ensurePreloaded(sdk);

      const [digitalOptions, balancesInstance] = await Promise.all([
        sdk.digitalOptions(),
        sdk.balances(),
      ]);
      
      const availableUnderlying = digitalOptions
        .getUnderlyingsAvailableForTradingAt(new Date())
        .find((item) => !item.isSuspended && item.name === assetName);

      if (!availableUnderlying) {
        this.logger.warn(
          `Digital asset "${assetName}" not available for trading.`,
        );
        throw new NotFoundException(
          `Ativo digital "${assetName}" não disponível para trading`,
        );
      }

      const instruments = await availableUnderlying.instruments();
      const availableInstrument = instruments
        .getAvailableForBuyAt(new Date())

        .find((instrument) => instrument.period === period);

      if (!availableInstrument) {
        this.logger.warn(
          `Instrument (period ${period}s) for digital asset "${assetName}" not found.`,
        );
        throw new NotFoundException(
          `Instrumento (período ${period}s) para o ativo "${assetName}" não encontrado`,
        );
      }

      const sdkBalanceType =
        account_type === AppAccountType.Real
          ? BalanceType.Real
          : BalanceType.Demo;
          
      const balance = balancesInstance
        .getBalances()
        .find((b) => b.type === sdkBalanceType);

      if (!balance) {
        this.logger.warn(`Balance type "${account_type}" not found.`);
        throw new NotFoundException(`Saldo "${account_type}" não encontrado`);
      }

      if (
        typeof balance.available !== 'number' ||
        balance.available < operationValue
      ) {
        this.logger.warn(
          `Insufficient balance. Available: ${balance.available}, Needed: ${operationValue}`,
        );
        throw new BadRequestException(
          `Saldo insuficiente para a operação. Disponível: ${balance.available}, Necessário: ${operationValue}`,
        );
      }

      const sdkDirection = mapTradeDirection(
        direction,
        DigitalOptionsDirection,
      );

      //this.logger.log(`Placing digital option order for instrument ID: ${availableInstrument.assetId}, direction: ${sdkDirection}`);
      const order = await digitalOptions.buySpotStrike(
        availableInstrument,
        sdkDirection,
        operationValue,
        balance,
      );

      this.logger.log(
        `Digital option purchased successfully. Order ID (example): ${order.id || 'N/A'}`,
      );
      return order;
    } catch (error) {
      this.logger.error(
        `Error buying digital option for asset "${assetName}": ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Erro ao comprar opção digital: ${errorMessage}`,
      );
    }
  }}
