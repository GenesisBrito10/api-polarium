import { IsEmail, IsNotEmpty } from 'class-validator';
import { SdkCredentialsDto } from '../../sdk/dto/sdk-credentials.dto.js';

export class GetHistoryDto {
    @IsEmail({}, { message: 'Deve ser um e-mail válido' })
    @IsNotEmpty({ message: 'Email é obrigatório' })
    email: string;


}