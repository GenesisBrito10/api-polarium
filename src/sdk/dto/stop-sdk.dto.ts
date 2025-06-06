import { IsEmail, IsNotEmpty } from 'class-validator';

export class StopSdkDto {
  @IsEmail({}, { message: 'Login deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Login é obrigatório' })
  login: string;
}