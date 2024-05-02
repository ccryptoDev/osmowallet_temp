import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { NitResponse } from './interfaces/nit.interface';

@Injectable()
export class InfileService {
    async verifyNit(nit: string): Promise<NitResponse> {
        try {
            const config = {
                method: 'POST',
                baseURL: 'https://consultareceptores.feel.com.gt',
                url: '/rest/action',
                data: {
                    emisor_codigo: '112319718',
                    emisor_clave: '9AFF98E7DCAAEF4EEA3B7C94A34D8092',
                    nit_consulta: nit,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new BadRequestException('Error verifying nit');
        }
    }
}
