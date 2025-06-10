import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import type {
  ClientSdk as ClientSdkType,
} from '@quadcode-tech/client-sdk-js';


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
  private sdkModulePromise: Promise<typeof import('@quadcode-tech/client-sdk-js')> | null = null;

  private loadSdkModule() {
    if (!this.sdkModulePromise) {
      this.sdkModulePromise = import('@quadcode-tech/client-sdk-js');
    }
    return this.sdkModulePromise;
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async warmUpSdk(sdk: ClientSdkType): Promise<void> {
    try {
      await Promise.all([
        sdk.balances().catch(() => undefined),
        sdk.digitalOptions().catch(() => undefined),
      ]);
    } catch (err) {
      this.logger.warn(
        `SDK warm-up failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }


 

  constructor(private configService: ConfigService) {
    const baseUrlWs = this.configService.get<string>('BASE_URL_WS');
    const baseUrlApi = this.configService.get<string>('BASE_URL_API');
    const brokerId = this.configService.get<number>('BROKER_ID');
    let ttlMs = Number(this.configService.get<number>('SDK_CACHE_TTL_MS'));
    if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
      ttlMs = 60 * 60 * 1000; // default to 1 hour
    }
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
    const normalizedLogin = this.normalizeEmail(login);
    try {
      const { ClientSdk, LoginPasswordAuthMethod } = await this.loadSdkModule();

      const sdk = await ClientSdk.create(
        this.baseUrlWs,
        this.brokerId,
        new LoginPasswordAuthMethod(this.baseUrlApi, normalizedLogin, password),
      );
      await this.warmUpSdk(sdk);
      this.logger.log(`SDK created successfully for login "${normalizedLogin}"`);
      return sdk;
    } catch (error) {
      this.logger.error(`Error creating SDK for login "${normalizedLogin}": ${error.message}`, error.stack);
      // Ensure error is an instance of Error for consistent message access
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Failed to create SDK: ${errorMessage}`);
    }
  }

  async getSdk(login: string, password: string): Promise<ClientSdkType> {
    const normalizedLogin = this.normalizeEmail(login);
    const passwordHash = this.hashPassword(password);
    const cachedEntry = this.sdkCache.get(normalizedLogin);

    if (cachedEntry && cachedEntry.passwordHash === passwordHash) {
      this.logger.log(`Using cached SDK for login "${normalizedLogin}"`);
      return cachedEntry.sdk;
    }

    if (cachedEntry && cachedEntry.passwordHash !== passwordHash) {
        this.logger.log(`Password changed for login "${normalizedLogin}". Recreating SDK.`);
        // Potentially close old SDK instance if necessary and SDK provides a method
        // await cachedEntry.sdk.close();
        this.sdkCache.delete(normalizedLogin);
    }
    if (this.creationPromises.has(normalizedLogin)) {
      this.logger.log(`Waiting for ongoing SDK creation for login "${normalizedLogin}"`);
      return this.creationPromises.get(normalizedLogin)!;
    }

    this.logger.log(`Creating new SDK instance for login "${normalizedLogin}"`);
    const creationPromise = this.createSdkInstance(normalizedLogin, password);
    this.creationPromises.set(normalizedLogin, creationPromise);
    try {
      const newSdk = await creationPromise;
      this.sdkCache.set(normalizedLogin, { sdk: newSdk, passwordHash });
      return newSdk;
    } finally {
      this.creationPromises.delete(normalizedLogin);
    }
  }

  removeSdkFromCache(login: string): boolean {
    const normalizedLogin = this.normalizeEmail(login);
    const cachedEntry = this.sdkCache.get(normalizedLogin);
    if (cachedEntry) {
      // Optional: Cleanly close/disconnect SDK if the SDK provides such a method
      // For example: if (typeof cachedEntry.sdk.close === 'function') { await cachedEntry.sdk.close(); }
      this.sdkCache.delete(normalizedLogin);
      this.logger.log(`SDK for login "${normalizedLogin}" removed from cache.`);
      return true;
    }
    this.logger.warn(`SDK for login "${normalizedLogin}" not found in cache for removal.`);
    return false;
  }
}