import { IsNotEmpty, IsString, IsEmail, MinLength, IsNumber } from 'class-validator';

export class GetOrderQueryDto {
  @IsEmail({}, { message: 'Login deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Login é obrigatório' })
  login: string;

  @IsString({ message: 'Password deve ser uma string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(1, { message: 'Password não pode ser vazio' })
  password: string;

  @IsString({ message: 'orderId deve ser uma string' })
  @IsNotEmpty({ message: 'orderId é obrigatório' })
  orderId: string;
}