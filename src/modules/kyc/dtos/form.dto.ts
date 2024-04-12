

import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class KycFormDto {

    @IsNotEmpty()
    tipo_id: any;

    @IsNotEmpty()
    autoridad: any;

    @IsNotEmpty()
    direccion: any;

    @IsNotEmpty()
    actividadeconomica: any;

    @IsNotEmpty()
    profesion: any;

    @IsNotEmpty()
    tiporesidencia: any;

    @IsNotEmpty()
    cargo: any;

    @IsNotEmpty()
    nivelestudio: any;

    @IsNotEmpty()
    marital: any;

    @IsNotEmpty()
    @IsNumber()
    monthly_income: number;

    @IsNotEmpty()
    id_provincia: any

    @IsNotEmpty()
    id_canton: any

    @IsNotEmpty()
    id_zona: any

    @IsOptional()
    business_name: string

    @IsOptional()
    business_nickname: string
}
