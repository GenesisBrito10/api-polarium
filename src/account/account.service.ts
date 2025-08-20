import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import type { ClientSdk as ClientSdkType, Balance as BalanceSdkType, ClientSdk } from '@quadcode-tech/client-sdk-js';

@Injectable()
export class AccountService {

    private readonly logger = new Logger(AccountService.name);

    async getAccountBalances(sdk: ClientSdk): Promise<{ type: BalanceSdkType['type']; amount: number }[]> {
        try {
            const balances: BalanceSdkType[] = (await sdk.balances()).getBalances();
            const mappedBalances = balances.map(balance => ({
                type: balance.type,
                amount: balance.amount,
                currency: balance.currency

            }));
            this.logger.log(`Fetched account balances: ${JSON.stringify(mappedBalances)}`);
            return mappedBalances;
        } catch (error) {
            this.logger.error(`Failed to fetch account balances: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Erro ao obter saldos da conta');
        }
    }
}