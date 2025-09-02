import { Injectable, Logger, NotFoundException, InternalServerErrorException, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { ClientSdk as ClientSdkType, Position as PositionSdkType } from '@quadcode-tech/client-sdk-js';
import { OrderResultDocument, OrderResultSchema } from './schemas/order-result.schema.js';



@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly subscriptionTimeout: number;

  constructor(
    private configService: ConfigService,
  @InjectConnection() private readonly connection: mongoose.Connection,
  ) {
    const timeout = 305000;
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

  async waitForOrderDetails(
    sdk: ClientSdkType,
    email: string,
    orderId: number,
    uniqueId: string,
  ): Promise<any> {
    this.logger.log(
      `Waiting for order details: ID ${orderId}, UniqueID: ${uniqueId}`,
    );
    const numericOrderId = orderId;
    if (isNaN(numericOrderId)) {
      throw new NotFoundException(
        `Order ID "${orderId}" is not a valid number.`,
      );
    }

    const { InstrumentType } = await import('@quadcode-tech/client-sdk-js');

    return new Promise(async (resolve, reject) => {
      let subscription;
      let timeoutId;

      try {
        const positions = await sdk.positions();

        timeoutId = setTimeout(() => {
          subscription?.unsubscribe();
          this.logger.warn(
            `Timeout waiting for order update: ID ${orderId}, UniqueID: ${uniqueId}`,
          );
          reject(
            new RequestTimeoutException(
              `Timeout: Could not get final order status for "${orderId}" within the time limit.`,
            ),
          );
        }, this.subscriptionTimeout);

        subscription = positions.subscribeOnUpdatePosition(
          (position: PositionSdkType) => {
            if (
              position.instrumentType === InstrumentType.DigitalOption &&
              Array.isArray(position.orderIds) &&
              position.status === 'closed' &&
              position.orderIds.includes(numericOrderId)
            ) {
              this.logger.log(
                `Order ID ${numericOrderId} for email ${email} is closed.`,
              );
              clearTimeout(timeoutId);
              subscription?.unsubscribe();
              const payload = this.cleanPositionPayload(position);
              resolve(payload); // Apenas resolve com o payload
            }
          },
        );
      } catch (error) {
        clearTimeout(timeoutId);
        subscription?.unsubscribe();
        this.logger.error(
          `Error waiting for order details: ID "${orderId}": ${error.message}`,
          error.stack,
        );
        reject(
          new InternalServerErrorException(
            `Error getting order details: ${error.message}`,
          ),
        );
      }
    });
  }

  /**
   * Salva o resultado de uma ordem no banco de dados.
   */
  async saveOrderResult(
    email: string,
    orderId: number,
    uniqueId: string,
    collection: string,
    payload: any,
  ): Promise<void> {
    try {
      const orderResultModel = this.connection.model(
        collection,
        OrderResultSchema,
        collection,
      );
      await orderResultModel.create({
        email,
        orderId,
        payload,
        uniqueId,
      });
      this.logger.log(`Stored order result for ID: ${orderId}, UniqueID: ${uniqueId}`);
    } catch (err) {
      this.logger.error(`Failed to store order result: ${err.message}`);
    }
  }

  // Método original mantido para compatibilidade com o OrderController
  async getOrderDetails(
    sdk: ClientSdkType,
    email: string,
    orderId: number,
    uniqueId: string,
    collection: string,
  ): Promise<any> {
    const orderResult = await this.waitForOrderDetails(
      sdk,
      email,
      orderId,
      uniqueId,
    );
    await this.saveOrderResult(
      email,
      orderId,
      uniqueId,
      collection,
      orderResult,
    );
    return orderResult;
  }


  async getOrderHistory(email: string, collection: string) {
    const orderResultModel = this.connection.model(collection, OrderResultSchema, collection);
    type LeanOrderResult = {
      _id: any;
      __v: number;
      uniqueId?: string;
      email: string;
      orderId: number;
      payload?: Record<string, any>;
    };
    const results = await orderResultModel.find({ email }).lean<LeanOrderResult[]>().exec();

    // Agrupa por uniqueId
    const grouped = results.reduce((acc, curr) => {
      const key = curr.uniqueId || 'no-unique-id';
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, LeanOrderResult[]>);

    // Para cada grupo, soma pnl e invest e retorna um único objeto por uniqueId
    const processed = Object.entries(grouped).map(([uniqueId, group]) => {
      const sumPnl = group.reduce((sum, item) => sum + Number(item.payload?.pnl ?? 0), 0);
      const sumInvest = group.reduce((sum, item) => sum + Number(item.payload?.invest ?? 0), 0);

      // Usa o primeiro como base, mas atualiza o payload
      const base = { ...group[0] };
      base.uniqueId = uniqueId;
      base.payload = {
      ...base.payload,
      pnl: sumPnl,
      invest: sumInvest,
      };

      // Gale info: a partir do segundo objeto (índice >= 1)
      const galeInfos = group.map((item, idx) => ({
      ...item,
      gale: idx,
      }));

      return { ...base, galeInfos };
    });

    return processed;
  }

  async getAllOrdersStatistics(collection: string) {
    try {
      const orderResultModel = this.connection.model(collection, OrderResultSchema, collection);
      
      type LeanOrderResult = {
        _id: any;
        __v: number;
        uniqueId?: string;
        email: string;
        orderId: number;
        payload?: Record<string, any>;
      };
      
      // Busca todos os resultados de todos os emails
      const results = await orderResultModel.find({}).lean<LeanOrderResult[]>().exec();

      // Agrupa por uniqueId
      const grouped = results.reduce((acc, curr) => {
        const key = curr.uniqueId || 'no-unique-id';
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {} as Record<string, LeanOrderResult[]>);

      // Para cada grupo, soma pnl e invest
      const processed = Object.entries(grouped).map(([uniqueId, group]) => {
        const sumPnl = group.reduce((sum, item) => sum + Number(item.payload?.pnl ?? 0), 0);
        const sumInvest = group.reduce((sum, item) => sum + Number(item.payload?.invest ?? 0), 0);

        return {
          uniqueId,
          email: group[0].email,
          totalOrders: group.length,
          totalPnl: sumPnl,
          totalInvest: sumInvest,
        };
      });

      // Calcula estatísticas dos ativos
      const assetStats = new Map<string, { id: number; name: string; isOtc: boolean; wins: number; total: number }>();
      
      results.forEach(item => {
        if (item.payload?.active) {
          const active = item.payload.active;
          const key = `${active.id}-${active.name}`;
          const pnl = Number(item.payload.pnl ?? 0);
          
          if (!assetStats.has(key)) {
            assetStats.set(key, {
              id: active.id,
              name: active.name,
              isOtc: active.isOtc,
              wins: 0,
              total: 0
            });
          }
          
          const stats = assetStats.get(key)!;
          stats.total += 1;
          if (pnl > 0) {
            stats.wins += 1;
          }
        }
      });

      // Converte Map para array com assertividade
      const assetsWithAccuracy = Array.from(assetStats.values()).map(asset => ({
        id: asset.id,
        name: asset.name,
        isOtc: asset.isOtc,
        totalTrades: asset.total,
        winRate: asset.total > 0 ? (asset.wins / asset.total) * 100 : 0
      }));

      // Calcula estatísticas gerais
      const totalOrders = processed.length;
      const totalPnl = processed.reduce((sum, item) => sum + item.totalPnl, 0);
      const totalInvest = processed.reduce((sum, item) => sum + item.totalInvest, 0);

      return {
        summary: {
          totalOrders,
          totalPnl,
          totalInvest,
        },
        assets: assetsWithAccuracy
      };
    } catch (error) {
      this.logger.error(`Error fetching all orders statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Erro ao obter estatísticas de todas as ordens: ${error.message}`);
    }
  }

}
