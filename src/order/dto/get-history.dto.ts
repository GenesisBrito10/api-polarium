import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GetHistoryDto {
    @IsEmail({}, { message: 'Deve ser um e-mail válido' })
    @IsNotEmpty({ message: 'Email é obrigatório' })
    email: string;

    @IsString({ message: 'collection deve ser uma string' })
    @IsNotEmpty({ message: 'collection é obrigatório' })
    collection: string;


}