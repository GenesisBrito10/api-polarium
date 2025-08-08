import { SdkCredentialsDto } from '../../sdk/dto/sdk-credentials.dto.js';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCandlesDto extends SdkCredentialsDto {
  @IsString({ message: 'pair deve ser uma string' })
  @IsNotEmpty({ message: 'pair é obrigatório' })
  pair: string;

  @IsNumber({}, { message: 'period deve ser um número' })
  @IsNotEmpty({ message: 'period é obrigatório' })
  @Type(() => Number)
  period: number;
}
