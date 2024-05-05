import { Injectable,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Nit } from 'src/entities/bill.entity';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { NitDto } from './dtos/nit.dto';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Wallet } from 'src/entities/wallet.entity';
import axios from 'axios';
import { Status } from 'src/common/enums/status.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { ExternalTask } from 'src/services/google-cloud-tasks/interfaces/externalTask.interface';
import { InfileService } from 'src/services/infile/infile.service';
import { CreateBillDto } from './dtos/createBill.dto';
import { JsonBillAdapter } from './adapter/json.adapter';
import { InfilePayload } from 'src/services/infile/interfaces/payload';

@Injectable()
export class BillsService {
    private queue = `BILLS-${process.env.ENV}`
    private url = `https://${process.env.DOMAIN}/bills`
    private infileQueue = `INFILE-${process.env.ENV}`
    private infileUrl = `https://certificador.feel.com.gt/fel/procesounificado/transaccion/v2/xml`

    constructor(
        @InjectRepository(Nit) private nitRepository: Repository<Nit>,
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        private infileService: InfileService,
        private googleCloudTasksService: GoogleCloudTasksService
    ){}

    async createUserBill(data: CreateBillDto){
        try{
        const toDate = new Date();
        toDate.setHours(23, 59, 59, 0);
        toDate.setDate(1);
        toDate.setDate(toDate.getDate() - 1);

        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 1);
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(1);
        
        const userId = data.userId
        const totals = await this.transactionRepository
        .createQueryBuilder("transaction")
        .select(["CONCAT(fromUser.firstName, ' ', fromUser.lastName) as fullName","fromUser.id as userId","fromUser.email as email","coin.acronym as acronym", "SUM(transaction.amount) as total"])
        .innerJoin("transaction.wallet", "wallet")
        .innerJoin("transaction.transactionGroup", "transactionGroup")
        .innerJoin("transactionGroup.fromUser", "fromUser")
        .innerJoin("wallet.coin", "coin")
        .where("fromUser.id = :userId", { userId })
        .andWhere("transaction.subtype IN (:...names)", {
            names: [
                'fee-buy',
                'fee-sell',
                'fee-autoconvert-sell',
                'fee-withdraw',
                'fee-funding'
            ]
        })
        .andWhere("transactionGroup.createdAt BETWEEN :fromDate AND :toDate", {
            fromDate: fromDate,
            toDate: toDate
        })
        .andWhere("transactionGroup.status = :statusName", {
            statusName: Status.COMPLETED
        })
        .groupBy("fromUser.email")
        .addGroupBy("fromUser.id")
        .addGroupBy("fromUser.first_name")
        .addGroupBy("fromUser.last_name")
        .addGroupBy("coin.acronym")
        .getRawMany();
        if(totals.length > 0){
            let nit = 'CF'
            const nitResponse = await this.nitRepository.findOne({
                where: {
                    user: {
                        id: userId
                    }
                }
            })
            if(nitResponse) {
                nit = nitResponse.nit
            }
            const bills = totals.map((total) => 
                JsonBillAdapter.createBillTemplate({
                    amount: parseFloat(total.total),
                    currency: total.acronym,
                    email: total.email,
                    fullName: total.fullname,
                    nit: nit,
                    userId: total.userid
                })
            )
            await Promise.all(bills.map(bill => this.addBillToQueue(bill)))
        }
        }catch(error){
            console.log(error)
        }
    }

    async addBillToQueue(bill: InfilePayload){
        const payload: ExternalTask = {
            body: bill.xml,
            headers: {
                'UsuarioApi': process.env.INFILE_USUARIO_API,
                'LlaveApi': process.env.INFILE_LLAVE_API,
                'UsuarioFirma': process.env.INFILE_USUARIO_API,
                'Identificador': bill.billId + new Date().toLocaleDateString('default', { month: '2-digit', year: 'numeric' }).replace('/', '-'),
                'LlaveFirma': process.env.INFILE_LLAVE_FIRMA,
                'Content-Type': 'application/xml'
            },
            queue: this.infileQueue,
            url: this.infileUrl,
        }
        this.googleCloudTasksService.createExternalTask(payload)
    }

    async sendBills(){
        const users = await this.getUsersToBill()
        if(users.length > 0){
            await Promise.all(users.map((user) => {
                const body = {
                    userId: user.userId
                }
                this.googleCloudTasksService.createInternalTask(this.queue,body,this.url)
            }))
        }
    }

    async getUsersToBill(){
        const toDate = new Date();
        toDate.setHours(23, 59, 59, 0);
        toDate.setDate(1);
        toDate.setDate(toDate.getDate() - 1);
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 1);
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(1);
        const users = await this.transactionGroupRepository
            .createQueryBuilder("transactionGroup")
            .select("DISTINCT(transactionGroup.fromUser.id)", "userId")
            .innerJoin("transactionGroup.transactions", "transaction")
            .innerJoin("transactionGroup.fromUser", "user")
            .where("transaction.subtype IN (:...names)", {
                names: [
                    'fee-buy',
                    'fee-sell',
                    'fee-recurrent-buy',
                    'fee-autoconvert-sell',
                    'fee-withdraw',
                    'fee-funding'
                ]
            })
            .andWhere("user.residence = :residence", { residence: 'GT' })
            .andWhere("transactionGroup.createdAt BETWEEN :fromDate AND :toDate", {
                fromDate: fromDate,
                toDate: toDate
            })
            .andWhere("transactionGroup.status = :statusName", {
                statusName: Status.COMPLETED
            })
            .getRawMany();
        return users
    }


    async getNit(authUser: AuthUser){
        const nit = await this.nitRepository.findOne({
            where: {
                user: {id: authUser.sub}
            }
        })
        return nit
    }

    async updateNit(authUser: AuthUser, data: NitDto){
        const nitVerificationResponse = await this.infileService.verifyNit(data.nit)
        if(nitVerificationResponse.nombre == '') throw new BadRequestException('Invalid Nit')
        try{
            let nit = await this.nitRepository.findOne({
                where: {
                    user: {id: authUser.sub}
                }
            })
            if(nit){
                await this.nitRepository.update(nit.id,{
                    nit: data.nit
                })
            }else{
                nit = this.nitRepository.create({user: {id: authUser.sub},nit: data.nit})
                await this.nitRepository.insert(nit)
            }
        }catch(error){
            throw new BadRequestException('Error getting nit')
        }
    }
}
