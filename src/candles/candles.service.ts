import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ClientSdk as ClientSdkType } from '@quadcode-tech/client-sdk-js';

@Injectable()
export class CandlesService {
  private readonly logger = new Logger(CandlesService.name);

  private async findActiveByName(sdk: ClientSdkType, pair: string) {
    const binaryActives = await sdk
      .binaryOptions()
      .then((b) => b.getActives())
      .catch(() => []);

    return binaryActives.find((a: any) => a.ticker === pair);
  }

  async getCandles(sdk: ClientSdkType, pair: string, period: number) {
    try {
      const active = await this.findActiveByName(sdk, pair);
      if (!active) {
        this.logger.warn(`Active ${pair} not found`);
        throw new NotFoundException('Ativo não encontrado.');
      }

      const candles = await sdk.candles();
      const candlesData = await candles.getCandles(active.id, period);

      const results = candlesData
        .slice(-20)
        .map((candle) => {
          const date = new Date((candle.from - 3 * 3600) * 1000);
          const iso = date.toISOString();
          const time = iso.replace(/\.000Z$/, '');
          return {
            open: candle.open,
            close: candle.close,
            high: candle.max, // trocando 'max' por 'high'
            low: candle.min,  // trocando 'min' por 'low'
            time,
          };
        })
        .reverse();

      return { coin: active.name, period, results };
    } catch (error) {
      this.logger.error(
        `Error processing candles for pair "${pair}": ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Erro ao processar os candles.');
    }
  }
}
