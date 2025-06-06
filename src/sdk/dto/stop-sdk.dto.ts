import { IsEmail, IsNotEmpty } from 'class-validator';

export class StopSdkDto {
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}