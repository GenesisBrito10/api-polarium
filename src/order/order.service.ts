import { Injectable, Logger, NotFoundException, InternalServerErrorException, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClientSdk as ClientSdkType, Position as PositionSdkType } from '@quadcode-tech/client-sdk-js';
import { OrderResult, OrderResultDocument } from './schemas/order-result.schema.js';



@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly subscriptionTimeout: number;

  constructor(
    private configService: ConfigService,
    @InjectModel(OrderResult.name) private orderResultModel: Model<OrderResultDocument>,
  ) {
    const timeout = this.configService.get<number>('ORDER_SUBSCRIPTION_TIMEOUT');
    if (timeout === undefined) {
      throw new Error('orderSubscriptionTimeout is not defined in configuration');
    }
    this.subscriptionTimeout = timeout;
  }

  private cleanPositionPayload(position: PositionSdkType) {
    return {
    
      activeId: position.activeId,
      closeQuote: position.closeQuote ?? null,
      currentQuote: position.currentQuote,
      closeTime: position.closeTime ? position.closeTime.toISOString() : null,
      invest: position.invest,
      openQuote: position.openQuote,
      openTime: position.openTime ? position.openTime.toISOString() : null,
      pnl: position.pnl,
      status: position.status,
      expirationTime: position.expirationTime ? position.expirationTime.toISOString() : null,
      direction: position.direction,
      active: position.active ? { 
        id: position.active.id,
        name: position.active.name,
        isOtc: position.active.isOtc,
      } : null,
    };
  }

  async getOrderDetails(sdk: ClientSdkType, email:string,orderId: number,uniqueId:string): Promise<any> {
    this.logger.log(`Attempting to get details for order ID: ${orderId}`);
    const numericOrderId =orderId;
    if (isNaN(numericOrderId)) {
        throw new NotFoundException(`Order ID "${orderId}" is not a valid number.`);
    }

 
    const { InstrumentType } = await import('@quadcode-tech/client-sdk-js');


    return new Promise(async (resolve, reject) => {
      let subscription; 
      let timeoutId;

      try {
        const positions = await sdk.positions();

        timeoutId = setTimeout(() => {
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
          this.logger.warn(`Timeout reached waiting for order update for ID: ${orderId}`);
          reject(new RequestTimeoutException(`Timeout: Não foi possível obter o status final da ordem "${orderId}" dentro do tempo limite.`));
        }, this.subscriptionTimeout);

        subscription = positions.subscribeOnUpdatePosition((position: PositionSdkType) => {
          this.logger.debug(`Received position update: ID ${position.internalId}, Status ${position.status}, Order IDs ${position.orderIds}`);
          
          if (
            position.instrumentType === InstrumentType.DigitalOption && 
            Array.isArray(position.orderIds) &&
            position.status === 'closed' && 
            position.orderIds.includes(numericOrderId)
          ) {
            this.logger.log(`Relevant closed position found for order ID ${orderId}: Position internal ID ${position.internalId}`);
            clearTimeout(timeoutId); 
            if (subscription && typeof subscription.unsubscribe === 'function') {
              subscription.unsubscribe(); 
            }
            const payload = this.cleanPositionPayload(position);
            this.orderResultModel
              .create({ email: email, orderId: numericOrderId, payload, uniqueId: uniqueId })
              .catch(err =>
                this.logger.error(
                  `Failed to store order result: ${err instanceof Error ? err.message : String(err)}`,
                ),
              );
            resolve(payload);
          }
        });
        this.logger.log(`Subscribed to position updates for order ID: ${orderId}. Waiting for 'closed' status.`);

      } catch (error) {
        clearTimeout(timeoutId);
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
        this.logger.error(`Error subscribing or fetching order details for ID "${orderId}": ${error.message}`, error.stack);
        const errorMessage = error instanceof Error ? error.message : String(error);
        reject(new InternalServerErrorException(`Erro ao obter detalhes da ordem: ${errorMessage}`));
      }
    });
  }

  async getOrderHistory(email: string) {
    // Busca todos os resultados pelo email
    const results = await this.orderResultModel.find({ email }).lean().exec();

    // Agrupa por uniqueId
    const grouped = results.reduce((acc, curr) => {
      const key = curr.uniqueId || 'no-unique-id';
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, typeof results>);

   
    const processed = Object.values(grouped).map(group => {
      // Se houver pelo menos um com pnl > 0, retorna só ele (primeiro encontrado)
      const positive = group.find(item => item.payload && typeof item.payload.pnl === 'number' && item.payload.pnl > 0);
      if (positive) return positive;

      // Se todos negativos ou zero, soma pnl e invest, retorna um objeto representando o grupo
      const sumPnl = group.reduce((sum, item) => sum + Number(item.payload?.pnl ?? 0), 0);
      const sumInvest = group.reduce((sum, item) => sum + Number(item.payload?.invest ?? 0), 0);

      // Usa o primeiro como base para o retorno
      const base = { ...group[0] };
      base.payload = {
      ...base.payload,
      pnl: sumPnl,
      invest: sumInvest,
      };
      return base;
    });

    return processed;
  }

}
