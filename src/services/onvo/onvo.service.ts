import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios'
import Decimal from 'decimal.js';
import { User } from 'src/entities/user.entity';
import { OnvoCustomer } from './interfaces/customer.interface';
import { OnvoPaymentMethodResponse } from './interfaces/payment.method';
import { CreateCardDto } from 'src/modules/card/dtos/card.dto';
import { UserCard } from 'src/schemas/userCard.schema';
import { OnvoPaymentIntent } from './interfaces/payment-intent.interface';
import { OnvoConfirmPaymentIntentDto } from './interfaces/confirm-payment-intent';

@Injectable()
export class OnvoService {
    private BASE_URL = 'https://api.onvopay.com'
    private SECRET_KEY = process.env.ONVO_SECRET_KEY

    async confirmPaymentIntent(data: OnvoConfirmPaymentIntentDto) {
        const config = {
            method: 'POST',
            baseURL: this.BASE_URL,
            url: `v1/payment-intents/${data.paymentIntentId}/confirm`,
            headers: {
                Authorization: `Bearer ${this.SECRET_KEY}`
            },
            data: {
                paymentMethodId: data.paymentMethodId,
                consumerId: data.consumerId
            }
        }
        const response = await axios(config)
        if(response.data.lastPaymentError){
            throw new BadRequestException(response.data.lastPaymentError.message)
        }
        return response.data
    }

    async createPaymentIntent(userCard: UserCard, amount: number) : Promise<OnvoPaymentIntent> {
        const amountInCents = new Decimal(amount).times(100)
        const totalAmount = new Decimal(Math.ceil(amountInCents.toNumber())).div(100)
        const denominatorFee = new Decimal(0.039).add(1)
        const amountToReceive = new Decimal(totalAmount).sub(0.25).div(denominatorFee).toFixed(2)
        const totalFee = new Decimal(totalAmount).sub(amountToReceive).toFixed(2)
        console.log('amountInCents',amountInCents)
        console.log('denominatorFee', denominatorFee)
        console.log('amountToReceive',amountToReceive)
        console.log('totalFee',totalFee)
        try{
            const config = {
                method: 'POST',
                baseURL: this.BASE_URL,
                url: `v1/payment-intents`,
                headers: {
                    Authorization: `Bearer ${this.SECRET_KEY}`
                },
                data: {
                    amount: amountInCents.toNumber(),
                    customerId: userCard.customerId,
                    currency: 'USD',
                    description: 'Funding',
                    metadata: {
                        userId: userCard.userId,
                    }
                }
            }
            const response = await axios(config)
            return response.data
        }catch(error){
            console.log(error.response.data)
        }
    }
    
    /**
     * Note: The `paymentMethodId` parameter should be the identifier used by Onvo,
     * not the identifier from our own database.
     */
    async deletePaymentMethod(paymentMethodId: string) {
        const config = {
            method: 'POST',
            baseURL: this.BASE_URL,
            url: `v1/payment-methods/${paymentMethodId}/detach`,
            headers: {
                Authorization: `Bearer ${this.SECRET_KEY}`
            }
        }
        await axios(config)
    }


    /**
     * This function creates a new customer in the Onvo system.
     * It takes a User object as input and returns a Promise that resolves to an OnvoCustomer object.
     * 
     * @param {User} user - The user object containing the details of the user to be created as a customer in Onvo.
     * @returns {Promise<OnvoCustomer>} - A promise that resolves to the newly created OnvoCustomer object.
     */
    async createCustomer(user: User) : Promise<OnvoCustomer>{
        const config = {
            method: 'POST',
            baseURL: this.BASE_URL,
            url: 'v1/customers',
            headers: {
                Authorization: `Bearer ${this.SECRET_KEY}`
            },
            data: {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                phone: user.mobile
            }
        }
        const response = await axios(config)
        return response.data
    }


    async createPaymentMethod(card: CreateCardDto, customerId?: string ) : Promise<OnvoPaymentMethodResponse>{
        const config = {
            method: 'POST',
            baseURL: this.BASE_URL,
            url: 'v1/payment-methods',
            headers: {
                Authorization: `Bearer ${this.SECRET_KEY}`
            },
            data: {
                card: {
                    number: card.number,
                    expMonth: card.expMonth,
                    expYear: card.expYear,
                    cvv: card.cvv,
                    holderName: card.holderName
                },
                customerId: customerId,
                type: 'card'
            }
        }
        try{
            const response = await axios(config)
            return response.data
        }catch(error){
            console.log(error)
        }
    }

    async updateCustomer(data: Partial<OnvoCustomer>, customerId: string) {
        const config = {
            method: 'POST',
            baseURL: this.BASE_URL,
            url: `/v1/customers/${customerId}`,
            headers: {
                Authorization: `Bearer ${this.SECRET_KEY}`
            },
            data,
        }
        try{
            const response = await axios(config)
            return response.data
        }catch(error){
            console.log(error)
            throw new InternalServerErrorException()
        }
    }
}
