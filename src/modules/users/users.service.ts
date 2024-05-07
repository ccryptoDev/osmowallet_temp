import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { In, Like, Repository } from 'typeorm';
import { UserDto } from './dtos/user.dto';
import { CheckUserDto } from './dtos/checkUser.dto';
import { CheckUserByUsername } from './dtos/checkByUsername.dto';
import { GetUserbyPhoneOrEmailDto } from '../partners/dtos/getUser.dto';
import { ResidenceChange } from 'src/schemas/residence-change.schema';
import { InjectModel } from '@nestjs/mongoose';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { Model } from 'mongoose';
import { UpdateResidenceDto } from '../me/dto/residence-update.dto';
import { AuthUser } from '../auth/payloads/auth.payload';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectModel(ResidenceChange.name) private residenceChangeModel: Model<ResidenceChange>,
        private algoliaService: AlgoliaService,
    ) {}

    async indexUser(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
            relations: { verifications: true, addresses: true },
        });
        if (!user) return;
        await this.algoliaService.saveUser(user);
    }

    async getResidenceChange(authUser: AuthUser) {
        const existingResidenceChange = await this.residenceChangeModel.findOne({ userId: authUser.sub }).exec();
        if (existingResidenceChange) return { residenceChanged: true };
        return { residenceChanged: false };
    }

    async updateResidence(userId: string, body: UpdateResidenceDto) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });
        if (!user) throw new NotFoundException('User not found');

        const existingResidenceChange = await this.residenceChangeModel.findOne({ userId: userId }).exec();
        if (!existingResidenceChange) {
            const newResidenceChange = new this.residenceChangeModel({
                userId: userId,
                country: body.residence,
            });
            await newResidenceChange.save();
        } else {
            existingResidenceChange.country = body.residence;
            await existingResidenceChange.save();
        }

        user.residence = body.residence;
        await this.userRepository.save(user);
        await this.indexUser(user.id);
    }

    async getUserById(id: string) {
        const user = await this.userRepository.findOneBy({ id: id });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async checkUserByUsername(query: CheckUserByUsername) {
        try {
            const user = await this.userRepository.findOne({
                select: { username: true },
                where: {
                    username: query.username.toLowerCase(),
                },
            });
            return {
                isValid: user == null,
            };
        } catch (error) {
            throw new BadRequestException('Error finding user');
        }
    }

    async getUsers(queries: UserDto) {
        if (queries.query == undefined) throw new BadRequestException('Invalid query');
        const users = await this.userRepository.find({
            relations: {
                verifications: true,
                addresses: true,
            },
            where: [
                { firstName: Like(`%${queries.query}%`) },
                { lastName: Like(`%${queries.query}%`) },
                { username: Like(`%${queries.query}%`) },
                { mobile: Like(`%${queries.query.trim()}%`) },
                { email: Like(`%${queries.query}%`) },
            ],
            take: queries.pageSize,
            skip: queries.skip,
        });

        return users;
    }

    async checkUserRegistered(data: CheckUserDto) {
        const users = this.userRepository.find({
            relations: {
                addresses: true,
                verifications: true,
            },
            where: {
                mobile: In(data.phones),
            },
        });

        return users;
    }

    async getUserbyPhoneOrEmail(queries: GetUserbyPhoneOrEmailDto) {
        const phoneNumber = `+${queries.phoneNumber}`;
        const user = await this.userRepository.findOne({
            relations: { verifications: true },
            where: [
                {
                    mobile: phoneNumber,
                },
                {
                    email: queries.email,
                },
            ],
        });
        if (!user) throw new NotFoundException('User not found');

        const newUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.mobile,
            nationality: user.nationality,
            kycStatus: user.verifications.kyc,
        };

        return newUser;
    }
}
