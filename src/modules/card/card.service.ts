import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCardDto } from './dtos/card.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { InjectModel } from '@nestjs/mongoose';
import { OnvoPaymentMethod } from 'src/schemas/card.schema';
import { FlattenMaps, Model, Types } from 'mongoose';
import { OnvoService } from 'src/services/onvo/onvo.service';
import { UserCard } from 'src/schemas/userCard.schema';
import { UsersService } from '../users/users.service';
import { OnvoPaymentMethodResponse } from 'src/services/onvo/interfaces/payment.method';

@Injectable()
export class CardService {
    constructor(
        @InjectModel(OnvoPaymentMethod.name) private paymentMethodModel: Model<OnvoPaymentMethod>,
        @InjectModel(UserCard.name) private userCardModel: Model<UserCard>,
        private onvoService: OnvoService,
        private userService: UsersService
    ){}

    async pay(userId: string, amount: number, paymentMethodId: string) {
        const paymentMethod = await this.paymentMethodModel.findById({_id: paymentMethodId})
        if(!paymentMethod) throw new BadRequestException('Invalid paymentMethod')
        const account = await this.getAccountByUserId(userId)
        
        const paymentIntent = await this.onvoService.createPaymentIntent(account,amount)
        await this.onvoService.confirmPaymentIntent({
            paymentIntentId: paymentIntent.id,
            consumerId: account.customerId,
            paymentMethodId: paymentMethod.paymentMethodId
        })
    }

    private async getAccountByUserId(id: string) {
        return await this.userCardModel.findOne({userId: id})
    }

    private async createCustomer(authUser: AuthUser): Promise<FlattenMaps<UserCard> & {_id: Types.ObjectId}> {
        const user = await this.userService.getUserById(authUser.sub);
        const onvoCustomer = await this.onvoService.createCustomer(user);
        const customer = await this.userCardModel.create({
            userId: authUser.sub,
            customerId: onvoCustomer.id
        });
        return customer
    }

    private async savePaymentMethod(body: CreateCardDto, onvoPaymentMethod: OnvoPaymentMethodResponse, userId: string){
        const newPaymentMethod = await this.paymentMethodModel.create({
            paymentMethodId: onvoPaymentMethod.id,
            alias: body.alias,
            brand: body.brand,
            userId: userId,
            card: {
                holderName: body.holderName,
                number: onvoPaymentMethod.card.last4,
            },
            status: onvoPaymentMethod.status,
            type: onvoPaymentMethod.type
        })
        return newPaymentMethod
    }

    async createPublicPaymentMethod(body: CreateCardDto){
        const onvoPaymentMethod = await this.onvoService.createPaymentMethod(body, null)
        return await this.savePaymentMethod(body,onvoPaymentMethod,'PUBLIC_USER')
    }

    async createPaymentMethod(authUser: AuthUser, body: CreateCardDto){
        console.log(authUser)
        const payments = await this.getPaymentMethods(authUser)
        if(payments.length == 3) throw new BadRequestException('Cards limit exceeded')
        let customer = await this.userCardModel.findOne({userId: authUser.sub}).lean();
        if(!customer){
            customer = await this.createCustomer(authUser);
        }
        const onvoPaymentMethod = await this.onvoService.createPaymentMethod(body, customer.customerId)
        const newPaymentMethod = await this.savePaymentMethod(body,onvoPaymentMethod,authUser.sub)
        if(payments.length == 1 || body.isDefault){
           await this.setDefaultCard(newPaymentMethod.id, authUser)
        }
    }
    
    async deletePaymentMethod(authUser: AuthUser, id: string) {
        const paymentMethod = await this.paymentMethodModel.findOne({
            userId: authUser.sub,
            _id: id
        })
        if(!paymentMethod) throw new BadRequestException('Invalid paymentMethod')
        await this.onvoService.deletePaymentMethod(paymentMethod.paymentMethodId)
        await this.paymentMethodModel.findOneAndRemove({_id: id})

    }
    
    async getPaymentMethods(authUser: AuthUser) {
        const paymentMethods = await this.paymentMethodModel.find({
            userId: authUser.sub
        })
        return paymentMethods
    }

    async setDefaultCard(id: string, authUser: AuthUser){
        const paymentMethod = await this.paymentMethodModel.findOne({_id: id, userId: authUser.sub}).exec();
        if(!paymentMethod) throw new BadRequestException('Invalid paymentMethod')
        await this.paymentMethodModel.updateMany({userId: authUser.sub},{isDefault: false})
        await this.paymentMethodModel.findOneAndUpdate({_id: id}, {isDefault: true})
    }
}
