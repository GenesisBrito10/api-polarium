import { BaseTradeDto } from '../../dto/base-trade.dto.js';
import { IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
export class BuyDigitalDto extends BaseTradeDto {
  @IsNumber({}, { message: 'period deve ser um número' })
  @IsPositive({ message: 'period deve ser um número positivo' })
  @IsNotEmpty({ message: 'period é obrigatório' })
  @Type(() => Number)
  period: number;
}
