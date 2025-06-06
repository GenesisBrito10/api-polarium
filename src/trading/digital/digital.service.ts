import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import type { ClientSdk as ClientSdkType, Balance as BalanceSdkType } from '@quadcode-tech/client-sdk-js';
import { BuyDigitalDto } from './dto/buy-digital.dto.js';
import { AccountType as AppAccountType } from '../../shared/enums/account-type.enum.js';
import { TradeDirection } from '../../shared/enums/direction.enum.js';

@Injectable()
export class DigitalService {
  private readonly logger = new Logger(DigitalService.name);

  async buyOption(sdk: ClientSdkType, buyDigitalDto: BuyDigitalDto) {
    const { assetName, operationValue, direction, account_type } = buyDigitalDto;

    this.logger.log(`Attempting to buy digital option for asset "${assetName}", value: ${operationValue}, direction: ${direction}, account: ${account_type}`);

    try {
      
      const { BalanceType, DigitalOptionsDirection } =  await import('@quadcode-tech/client-sdk-js');

      const [digitalOptions, balancesInstance] = await Promise.all([
        sdk.digitalOptions(),
        sdk.balances(),
      ]);

   

      const availableUnderlying = digitalOptions
        .getUnderlyingsAvailableForTradingAt(new Date())
        .find(item => !item.isSuspended && item.name === assetName);

      if (!availableUnderlying) {
        this.logger.warn(`Digital asset "${assetName}" not available for trading.`);
        throw new NotFoundException(`Ativo digital "${assetName}" não disponível para trading`);
      }

      const instruments = await availableUnderlying.instruments();
      const availableInstrument = instruments
        .getAvailableForBuyAt(new Date())
        .find(instrument => instrument.period === 60); 

      if (!availableInstrument) {
        this.logger.warn(`Instrument (period 60s) for digital asset "${assetName}" not found.`);
        throw new NotFoundException(`Instrumento (período 60s) para o ativo "${assetName}" não encontrado`);
      }
      const saoPauloDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      this.logger.log(`Data/hora em São Paulo: ${saoPauloDate}`);
      const sdkBalanceType = account_type === AppAccountType.Real ? BalanceType.Real : BalanceType.Demo;
      const balance = balancesInstance.getBalances().find(b => b.type === sdkBalanceType);

      if (!balance) {
        this.logger.warn(`Balance type "${account_type}" not found.`);
        throw new NotFoundException(`Saldo "${account_type}" não encontrado`);
      }

      if (typeof balance.available !== 'number' || balance.available < operationValue) {
        this.logger.warn(`Insufficient balance. Available: ${balance.available}, Needed: ${operationValue}`);
        throw new BadRequestException(`Saldo insuficiente para a operação. Disponível: ${balance.available}, Necessário: ${operationValue}`);
      }

      const sdkDirection = direction === TradeDirection.Call ? DigitalOptionsDirection.Call : DigitalOptionsDirection.Put;
      
      this.logger.log(`Placing digital option order for instrument ID: ${availableInstrument.assetId}, direction: ${sdkDirection}`);
      const order = await digitalOptions.buySpotStrike(
        availableInstrument,
        sdkDirection,
        operationValue,
        balance,
      );

      this.logger.log(`Digital option purchased successfully. Order ID (example): ${order.id || 'N/A'}`);
      return order;
    } catch (error) {
      this.logger.error(`Error buying digital option for asset "${assetName}": ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Erro ao comprar opção digital: ${errorMessage}`);
    }
  }
}