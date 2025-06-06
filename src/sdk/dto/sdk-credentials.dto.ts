import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SdkCredentialsDto {
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Password deve ser uma string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(1, { message: 'Password não pode ser vazio' }) // Adjust MinLength as needed
  password: string;
}