import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ClientSdk as ClientSdkType } from '@quadcode-tech/client-sdk-js';
import { mapTradeDirection } from '../utils/map-direction.util.js';
import { BuyBinaryDto } from './dto/buy-binary.dto.js';
import { AccountType as AppAccountType } from '../../shared/enums/account-type.enum.js';

@Injectable()
export class BinaryService {
  private readonly logger = new Logger(BinaryService.name);

  async buyOption(
    sdk: ClientSdkType,
    buyBinaryDto: BuyBinaryDto,
  ): Promise<any> {
    const { assetName, operationValue, direction, account_type, period } =
      buyBinaryDto;

    this.logger.log(
      `Attempting to buy binary option for asset "${assetName}", value: ${operationValue}, direction: ${direction}, account: ${account_type}, period: ${period}`,
    );

    try {
      const { BalanceType, BinaryOptionsDirection } = await import(
        '@quadcode-tech/client-sdk-js'
      );

      const [binaryOptions, balancesInstance] = await Promise.all([
        sdk.binaryOptions(),
        sdk.balances(),
      ]);

      const availableActive = binaryOptions
        .getActives()
        .find((item) => !item.isSuspended && item.name === assetName);

      if (!availableActive) {
        this.logger.warn(
          `Binary asset "${assetName}" not available for trading.`,
        );
        throw new NotFoundException(
          `Ativo binário "${assetName}" não disponível para trading`,
        );
      }

      const instruments = await availableActive.instruments();
      const availableInstrument = instruments
        .getAvailableForBuyAt(new Date())
        .find((instrument) => instrument.period === period);

      if (!availableInstrument) {
        this.logger.warn(
          `Instrument (period ${period}s) for binary asset "${assetName}" not found.`,
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

      const sdkDirection = mapTradeDirection(direction, BinaryOptionsDirection);

      const order = await binaryOptions.buy(
        availableInstrument,
        sdkDirection,
        operationValue,
        balance,
      );

      this.logger.log(
        `Binary option purchased successfully. Order ID (example): ${order.id || 'N/A'}`,
      );
      return order;
    } catch (error) {
      this.logger.error(
        `Error buying binary option for asset "${assetName}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
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
        `Erro ao comprar opção binária: ${errorMessage}`,
      );
    }
  }
}
