import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderResultDocument = OrderResult & Document;

@Schema({ timestamps: true })
export class OrderResult {
  @Prop()
  orderId!: number;

  @Prop({ type: Object })
  payload!: unknown;
}

export const OrderResultSchema = SchemaFactory.createForClass(OrderResult);
