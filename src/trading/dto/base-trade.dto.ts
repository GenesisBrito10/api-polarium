import { IsNotEmpty, IsString, IsNumber, IsEnum, IsPositive } from 'class-validator';
import { SdkCredentialsDto } from '../../sdk/dto/sdk-credentials.dto.js';
import { AccountType } from '../../shared/enums/account-type.enum.js';
import { TradeDirection } from '../../shared/enums/direction.enum.js';
import { Type } from 'class-transformer'; // Required for nested validation

export class BaseTradeDto extends SdkCredentialsDto {
  @IsString({ message: 'assetName deve ser uma string' })
  @IsNotEmpty({ message: 'assetName é obrigatório' })
  assetName: string;

  @IsNumber({}, { message: 'operationValue deve ser um número' })
  @IsPositive({ message: 'operationValue deve ser um número positivo' })
  @Type(() => Number) // Ensure transformation from string if necessary
  operationValue: number;

  @IsEnum(TradeDirection, { message: 'direction deve ser "CALL" ou "PUT"' })
  @IsNotEmpty({ message: 'direction é obrigatório' })
  direction: TradeDirection;

  @IsEnum(AccountType, { message: 'account_type deve ser "demo" ou "real"' })
  @IsNotEmpty({ message: 'account_type é obrigatório' })
  account_type: AccountType;
}