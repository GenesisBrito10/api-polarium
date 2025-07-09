import { BaseTradeDto } from '../../dto/base-trade.dto.js';
import { IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
export class BuyDigitalDto extends BaseTradeDto {
  @IsNumber({}, { message: 'option_period deve ser um número' })
  @IsPositive({ message: 'option_period deve ser um número positivo' })
  @IsNotEmpty({ message: 'option_period é obrigatório' })
  @Type(() => Number)
  option_period: number;
}
