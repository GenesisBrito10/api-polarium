import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'identifier deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'identifier é obrigatório' })
  identifier: string;

  @IsString({ message: 'password deve ser uma string' })
  @IsNotEmpty({ message: 'password é obrigatório' })
  password: string;

  @IsString({ message: 'first_name deve ser uma string' })
  @IsNotEmpty({ message: 'first_name é obrigatório' })
  first_name: string;

  @IsString({ message: 'last_name deve ser uma string' })
  @IsNotEmpty({ message: 'last_name é obrigatório' })
  last_name: string;
}
