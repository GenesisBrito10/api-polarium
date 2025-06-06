import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEmail } from 'class-validator';
import { Document } from 'mongoose';

export type OrderResultDocument = OrderResult & Document;

@Schema({ timestamps: true })
export class OrderResult {
  @Prop({ required: true })
  @IsEmail()
  email!: string;

  @Prop({ required: true, index: true })
  orderId!: number;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;
}

export const OrderResultSchema = SchemaFactory.createForClass(OrderResult);
