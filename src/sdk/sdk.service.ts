import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import type {
  ClientSdk as ClientSdkType,
} from '@quadcode-tech/client-sdk-js';
import type SdkModule from '@quadcode-tech/client-sdk-js';

interface CachedSdk {
  sdk: ClientSdkType; 
  passwordHash: string;
}


@Injectable()
export class SdkService {
  private readonly logger = new Logger(SdkService.name);
  private readonly sdkCache: LRUCache<string, CachedSdk>;
  private readonly creationPromises = new Map<string, Promise<ClientSdkType>>();
  private readonly baseUrlWs: string;
  private readonly baseUrlApi: string;
  private readonly brokerId: number;
  private sdkModulePromise: Promise<typeof SdkModule> | null = null;

  private loadSdkModule() {
    if (!this.sdkModulePromise) {
      this.sdkModulePromise = import('@quadcode-tech/client-sdk-js');
    }
    return this.sdkModulePromise;
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  constructor(private configService: ConfigService) {
    const baseUrlWs = this.configService.get<string>('sdk.baseUrlWs');
    const baseUrlApi = this.configService.get<string>('sdk.baseUrlApi');
    const brokerId = this.configService.get<number>('sdk.brokerId');
    const ttlMs = this.configService.get<number>('sdkCacheTtlMs') ?? 60 * 60 * 1000;
    this.sdkCache = new LRUCache<string, CachedSdk>({ max: 50, ttl: ttlMs });

    if (!baseUrlWs || !baseUrlApi || !brokerId) {
      this.logger.error('SDK base URLs or Broker ID are not configured. Check your .env file.');
      throw new InternalServerErrorException('SDK configuration is missing.');
    }

    this.baseUrlWs = baseUrlWs;
    this.baseUrlApi = baseUrlApi;
    this.brokerId = brokerId;

    // Preload SDK module to reduce first-call latency
    this.loadSdkModule().catch(err =>
      this.logger.warn(`Failed to preload SDK module: ${err instanceof Error ? err.message : String(err)}`),
    );
  }

  private async createSdkInstance(login: string, password: string): Promise<ClientSdkType> {
    try {
      const { ClientSdk, LoginPasswordAuthMethod } = await this.loadSdkModule();

      const sdk = await ClientSdk.create(
        this.baseUrlWs,
        this.brokerId,
        new LoginPasswordAuthMethod(this.baseUrlApi, login, password),
      );
      this.logger.log(`SDK created successfully for login "${login}"`);
      return sdk;
    } catch (error) {
      this.logger.error(`Error creating SDK for login "${login}": ${error.message}`, error.stack);
      // Ensure error is an instance of Error for consistent message access
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Failed to create SDK: ${errorMessage}`);
    }
  }

  async getSdk(login: string, password: string): Promise<ClientSdkType> {
    const passwordHash = this.hashPassword(password);
    const cachedEntry = this.sdkCache.get(login);

    if (cachedEntry && cachedEntry.passwordHash === passwordHash) {
      this.logger.log(`Using cached SDK for login "${login}"`);
      return cachedEntry.sdk;
    }

    if (cachedEntry && cachedEntry.passwordHash !== passwordHash) {
        this.logger.log(`Password changed for login "${login}". Recreating SDK.`);
        // Potentially close old SDK instance if necessary and SDK provides a method
        // await cachedEntry.sdk.close();
        this.sdkCache.delete(login);
    }
    if (this.creationPromises.has(login)) {
      this.logger.log(`Waiting for ongoing SDK creation for login "${login}"`);
      return this.creationPromises.get(login)!;
    }

    this.logger.log(`Creating new SDK instance for login "${login}"`);
    const creationPromise = this.createSdkInstance(login, password);
    this.creationPromises.set(login, creationPromise);
    try {
      const newSdk = await creationPromise;
      this.sdkCache.set(login, { sdk: newSdk, passwordHash });
      return newSdk;
    } finally {
      this.creationPromises.delete(login);
    }
  }

  removeSdkFromCache(login: string): boolean {
    const cachedEntry = this.sdkCache.get(login);
    if (cachedEntry) {
      // Optional: Cleanly close/disconnect SDK if the SDK provides such a method
      // For example: if (typeof cachedEntry.sdk.close === 'function') { await cachedEntry.sdk.close(); }
      this.sdkCache.delete(login);
      this.logger.log(`SDK for login "${login}" removed from cache.`);
      return true;
    }
    this.logger.warn(`SDK for login "${login}" not found in cache for removal.`);
    return false;
  }
}