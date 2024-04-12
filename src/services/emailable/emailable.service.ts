import { BadRequestException, Injectable } from '@nestjs/common';
import * as Sentry from "@sentry/node";
import axios from 'axios';

@Injectable()
export class EmailableService {

    async verify(email: string){
        try{
            const config = {
                method: 'GET',
                baseURL: 'https://api.emailable.com/v1',
                url: `/verify/?email=${email}&api_key=${process.env.EMAILABLE_KEY}`
            }
            const response = await axios(config)
            return response.data
        }catch(error){
            this.logError(error,email)
            throw new BadRequestException('Error validating email')
        }
    }

    async logError(error: any, email: string) {
        Sentry.captureException(error,{
          extra: {
            email: email
          }
        })
  }
}
