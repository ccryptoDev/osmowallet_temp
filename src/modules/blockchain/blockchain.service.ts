import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockchainNetwork } from 'src/entities/blockchainNetworks.entity';
import { BlockchainNetworkAddress } from 'src/entities/userBlockchainNetworkAddress.entity';
import { IsNull, Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateBlockChainAddress } from './dtos/blockchainAddress.dto';

@Injectable()
export class BlockchainService {
    constructor(
        @InjectRepository(BlockchainNetwork) private blockchainNetworkRepository: Repository<BlockchainNetwork>,
        @InjectRepository(BlockchainNetworkAddress) private userBlockRepository: Repository<BlockchainNetworkAddress>,
    ){}

    async getOsmoAddresses() {
        const blockChainNetworks = await this.userBlockRepository.find({
            relations: {network: true},
            where: {
                user: IsNull()
            }
        })
        return blockChainNetworks
    }

    async deleteBlockChainAddress(id: string){
        const blockChainAddress = await this.userBlockRepository.findOneBy({id: id})
        if(!blockChainAddress) throw new BadRequestException('Invalid ')
        await this.userBlockRepository.remove(blockChainAddress)
    }

    async updateBlockChainAddress(id: string, data: CreateBlockChainAddress){
        const network = await this.blockchainNetworkRepository.findOneBy({id: data.networkId})
        if(!network) throw new BadRequestException('Invalid network')
        await this.userBlockRepository.update(id, {
            address: data.address,
            network: network
        })
    }

    async createBlockChainAddress(authUser: AuthUser, data: CreateBlockChainAddress) {
        const network = await this.blockchainNetworkRepository.findOneBy({id: data.networkId})
        if(!network) throw new BadRequestException('Invalid network')

        const blockChainAddress = this.userBlockRepository.create({
            address: data.address,
            network: network,
            user: {id: authUser.sub}
        })
        await this.userBlockRepository.insert(blockChainAddress)
    }

    async getBlockChainAddresses(authUser: AuthUser) {
        const blockChainAddresses = await this.userBlockRepository.find({
            relations: {
                network: true
            },
            where: {
                user: {
                    id: authUser.sub
                }
            }
        })
        return blockChainAddresses
    }


    async getBlockchainNetworks() {
        const blockChainNetworks = await this.blockchainNetworkRepository.find()
        return blockChainNetworks
    }


}
