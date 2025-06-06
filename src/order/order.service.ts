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
    const timeout = this.configService.get<number>('orderSubscriptionTimeout');
    if (timeout === undefined) {
      throw new Error('orderSubscriptionTimeout is not defined in configuration');
    }
    this.subscriptionTimeout = timeout;
  }

  private cleanPositionPayload(position: PositionSdkType) {
    return {
      externalId: position.externalId,
      internalId: position.internalId,
      activeId: position.activeId,
      balanceId: position.balanceId,
      closeProfit: position.closeProfit ?? null,
      closeQuote: position.closeQuote ?? null,
      closeReason: position.closeReason ?? null,
      currentQuote: position.currentQuote,
      closeTime: position.closeTime ? position.closeTime.toISOString() : null,
      expectedProfit: position.expectedProfit,
      instrumentType: position.instrumentType,
      invest: position.invest,
      openQuote: position.openQuote,
      openTime: position.openTime ? position.openTime.toISOString() : null,
      pnl: position.pnl,
      pnlNet: position.pnlNet,
      pnlRealized: position.pnlRealized ?? null,
      quoteTimestamp: position.quoteTimestamp ? position.quoteTimestamp.toISOString() : null,
      currentQuoteTimestamp: position.currentQuoteTimestamp ? position.currentQuoteTimestamp.toISOString() : null,
      status: position.status,
      userId: position.userId,
      sellProfit: position.sellProfit,
      orderIds: position.orderIds,
      expirationTime: position.expirationTime ? position.expirationTime.toISOString() : null,
      direction: position.direction,
      active: position.active ? { 
        id: position.active.id,
        name: position.active.name,
        isOtc: position.active.isOtc,
      } : null,
    };
  }

  async getOrderDetails(sdk: ClientSdkType, orderId: number): Promise<any> {
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
              .create({ orderId: numericOrderId, payload })
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
}
