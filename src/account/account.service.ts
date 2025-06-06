import { Injectable, Logger } from '@nestjs/common';
import type { ClientSdk as ClientSdkType, Balance as BalanceSdkType, ClientSdk } from '@quadcode-tech/client-sdk-js';

@Injectable()
export class AccountService {

    private readonly logger = new Logger(AccountService.name);

    async getAccountBalances(sdk: ClientSdk) {
       
        const balances: BalanceSdkType[] = (await sdk.balances()).getBalances();
        const mappedBalances = balances.map(balance => ({
            type: balance.type,
            ammount: balance.amount
        }));
        this.logger.log(`Fetched account balances: ${JSON.stringify(mappedBalances)}`);
        return mappedBalances;

        
    }
}