import { IsNotEmpty, IsString, IsEmail, MinLength, IsNumber } from 'class-validator';

export class GetOrderQueryDto {
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Password deve ser uma string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(1, { message: 'Password não pode ser vazio' })
  password: string;

  @IsString({ message: 'orderId deve ser uma string' })
  @IsNotEmpty({ message: 'orderId é obrigatório' })
  orderId: string;

  @IsString({ message: 'uniqueId deve ser uma string' })
  @IsNotEmpty({ message: 'uniqueId é obrigatório' })
  uniqueId: string;
}