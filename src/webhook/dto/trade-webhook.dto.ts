import { IsEnum, IsNumber, IsString } from 'class-validator';
import { TradeDirection } from '../../shared/enums/direction.enum.js';

export class TradeWebhookDto {
  @IsString()
  pair!: string;

  @IsNumber()
  period!: number;

  @IsEnum(TradeDirection)
  direction!: TradeDirection;
}
