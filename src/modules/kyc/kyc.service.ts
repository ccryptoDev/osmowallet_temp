import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import { Model } from 'mongoose';
import { KycPartnerEnum } from 'src/common/enums/kyc-partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { RedisService } from 'src/common/services/redis/redis.service';
import { getKycDocumentNumber } from 'src/common/utils/kyc-document-number.util';
import { Country } from 'src/entities/country.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { User } from 'src/entities/user.entity';
import { Verification } from 'src/entities/verification.entity';
import { KycPartner, KycPartnerStatus } from 'src/schemas/kyc.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { UsersService } from '../users/users.service';
import { KycWorkFlowEventDto } from './dtos/step.dto';
import { KycStatus } from './enums/kycStatus.enum';
import { KycStep } from './enums/kycStep.enum';
import { MetaMapUser } from './interfaces/raw-kyc';
import { UpdateProviderKyc } from './interfaces/update-kyc-bank';

@Injectable()
export class KycService {
    private BASE_URL = process.env.KYC_BASE_URL;
    private queue = `GET-KYC-COUNTRY-${process.env.ENV}`;
    private QUEUE_URL = `https://${process.env.DOMAIN}/kyc/country`;
    private RIDIVI_QUEUE = `RIDIVI-${process.env.ENV}`;
    private RIDIVI_NEW_KYC_URL = `https://${process.env.DOMAIN}/ridivi/accounts`;
    constructor(
        @InjectRepository(KycVerification) private kycVerificationRepository: Repository<KycVerification>,
        @InjectRepository(KycVerificationStep) private kycVerificationStepRepository: Repository<KycVerificationStep>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Country) private countryRepository: Repository<Country>,
        @InjectRepository(Verification) private verificationRepository: Repository<Verification>,
        @InjectModel(KycPartnerStatus.name) private kycPartnerStatusModel: Model<KycPartnerStatus>,
        private pushNotificationService: PushNotificationService,
        private googleCloudTasksService: GoogleCloudTasksService,
        private userService: UsersService,
        private redisService: RedisService,
    ) {}

    async updateBankKyc(updateProviderKyc: UpdateProviderKyc) {
        const kycPartnerStatus = await this.getKycPartnerStatuses({ sub: updateProviderKyc.userId });
        if (!kycPartnerStatus) throw new BadRequestException('Kyc partner status not found');

        const solfinKyc = kycPartnerStatus.kycs.find((kyc) => kyc.partner === KycPartnerEnum.BANK);
        if (!solfinKyc) throw new BadRequestException('Kyc partner status not found');

        solfinKyc.status = updateProviderKyc.status;
        await kycPartnerStatus.save();
    }

    async createKycPartnerStatus(userId: string) {
        const bankPartner: KycPartner = {
            partner: KycPartnerEnum.BANK,
            status: Status.PENDING,
        };
        const cardPartner: KycPartner = {
            partner: KycPartnerEnum.CARD,
            status: Status.PENDING,
        };
        await this.kycPartnerStatusModel.create({
            userId: userId,
            kycs: [bankPartner, cardPartner],
        });
    }

    async getKycPartnerStatuses(authUser: AuthUser) {
        const kycs = await this.kycPartnerStatusModel.findOne({
            userId: authUser.sub,
        });
        return kycs;
    }

    async manageEvent(data: KycWorkFlowEventDto) {
        const verificationId = data.resource.split('/').pop();
        if (data.metadata && data.metadata.hasOwnProperty('userId')) {
            const userId = data.metadata['userId' as keyof KycWorkFlowEventDto['metadata']];
            if (userId !== undefined) {
                const user = await this.userRepository.findOne({ relations: { verifications: true }, where: { id: userId } });
                if (!user) throw new BadRequestException('User not found');

                let kycVerification = await this.kycVerificationRepository.findOne({
                    where: {
                        user: { id: userId },
                    },
                });

                if (!kycVerification) {
                    kycVerification = this.kycVerificationRepository.create({
                        attemps: 1,
                        verificationId: verificationId,
                        status: Status.CREATED,
                        user: user,
                    });
                    await this.kycVerificationRepository.save(kycVerification, { reload: true });
                    const steps = Object.values(KycStep);
                    const kycVerificationSteps = steps.map((step) => ({ step: step, verification: kycVerification as KycVerification }));
                    await this.kycVerificationStepRepository.insert(kycVerificationSteps);
                }
                if (data.step !== undefined) {
                    await this.verifyStep(data, kycVerification);
                }
                if (data.eventName != undefined) {
                    if (data.eventName == 'verification_inputs_completed' || data.eventName == 'verification_started') {
                        await this.kycVerificationRepository.update(kycVerification.id, { status: Status.IN_PROCESS });
                    }
                    if (data.eventName == 'verification_completed') {
                        await this.kycVerificationRepository.update(kycVerification.id, {
                            attemps: kycVerification.attemps++,
                            verificationId: verificationId,
                        });
                    }
                    if (data.eventName == 'verification_expired') {
                        await this.kycVerificationRepository.update(kycVerification.id, {
                            attemps: kycVerification.attemps++,
                            verificationId: verificationId,
                            status: Status.CREATED,
                        });
                    }
                }
                if (data.identityStatus !== undefined) {
                    let status = Status.PENDING;
                    switch (data.identityStatus) {
                        case KycStatus.VERIFIED:
                            status = Status.VERIFIED;
                            break;
                        case KycStatus.REJECTED:
                            status = Status.REJECTED;
                            break;
                        case KycStatus.REVIEW_NEEDED:
                            status = Status.REVIEW_NEEDED;
                            break;
                    }
                    if (data.identityStatus != KycStatus.VERIFIED && kycVerification.attemps == 3) {
                        //sendEmail
                        status = Status.PENDING;
                    }
                    await this.kycVerificationRepository.update(kycVerification.id, { status: status });
                    if (status == Status.REJECTED) {
                        const verification = await this.verificationRepository.findOne({
                            where: {
                                user: { id: user.id },
                            },
                        });
                        if (!verification) throw new BadRequestException('Verification not found');

                        await this.verificationRepository.update(verification.id, { kyc: false });
                        await this.userService.indexUser(user.id);
                    }
                    if (data.identityStatus == KycStatus.VERIFIED) {
                        this.pushNotificationService.sendPushToUser(user, {
                            title: 'Verificación finalizada',
                            message: 'El proceso de verificacion termino, ahora puedes acceder a todas las funcionalidades de Osmo!',
                        });
                        const verification = await this.verificationRepository.findOne({
                            where: {
                                user: { id: user.id },
                            },
                        });
                        if (!verification) throw new BadRequestException('Verification not found');

                        await this.verificationRepository.update(verification.id, { kyc: true });
                        await this.userService.indexUser(userId);
                        this.googleCloudTasksService.createInternalTask(
                            this.queue,
                            {
                                verificationId: verificationId,
                            },
                            this.QUEUE_URL,
                        );
                    }
                }
            }
        }
    }

    private async generateToken() {
        try {
            const config = {
                baseURL: `${process.env.KYC_BASE_URL}/oauth`,
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${process.env.KYC_TOKEN}`,
                },
                data: {
                    grant_type: 'client_credentials',
                },
            };
            const response = await axios(config);
            return response.data.access_token;
        } catch (error) {
            console.log(error);
            if (error instanceof AxiosError) console.log(error.response?.data);
        }
    }

    async getKycUser<T>(verificationId: string) {
        try {
            const token = await this.generateToken();
            const config = {
                url: `/v2/verifications/${verificationId}`,
                baseURL: this.BASE_URL,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios<T>(config);
            return response.data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async saveCountry(verificationId: string) {
        const metamapKycVerification = await this.getKycUser<MetaMapUser>(verificationId);
        const countryCode = metamapKycVerification.documents[0]?.country;
        const kycVerification = await this.kycVerificationRepository.findOne({
            relations: { user: true },
            where: {
                verificationId: verificationId,
            },
        });
        if (kycVerification) {
            const documentNumber = getKycDocumentNumber(metamapKycVerification);
            await this.kycVerificationRepository.update(kycVerification.id, {
                documentNumber: documentNumber,
            });
            if (kycVerification.user.residence == 'CR') {
                this.googleCloudTasksService.createInternalTask(
                    this.RIDIVI_QUEUE,
                    {
                        userId: kycVerification.user.id,
                        documentId: documentNumber,
                    },
                    this.RIDIVI_NEW_KYC_URL,
                );
            }
            this.saveName(metamapKycVerification, kycVerification.user);
            if (countryCode !== undefined) {
                await this.userRepository.update(kycVerification.user.id, { nationality: countryCode });
            } else {
                throw new BadRequestException('Country no saved yet');
            }
        }
    }

    private async saveName(metamapUser: MetaMapUser, user: User) {
        const steps = metamapUser.documents[0]?.steps;
        const metamapName = steps?.find((step: { id: string }) => step.id === 'document-reading')?.data?.fullName.value || '';
        const { firstName, lastName } = this.parseName(metamapName);
        await this.userRepository.update(user.id, { firstName: firstName.toLowerCase(), lastName: lastName.toLowerCase() });
        await this.userService.indexUser(user.id);
    }

    private parseName(fullName: string): { firstName: string; lastName: string } {
        const parts = fullName.split(' ');
        const numParts = parts.length;
        if (numParts === 1) {
            // Si no hay espacios, asumimos que la cadena es solo un nombre
            return { firstName: fullName, lastName: '' };
        }
        if (numParts === 2) {
            // Si hay un espacio, asumimos que la cadena tiene un solo nombre y un solo apellido
            return { firstName: parts[0] ?? '', lastName: parts[1] ?? '' };
        }
        if (numParts === 3) {
            // Si hay dos espacios, asumimos que la cadena tiene dos nombres y un apellido
            return { firstName: parts[0] + ' ' + parts[1], lastName: parts[2] ?? '' };
        }
        if (numParts >= 4) {
            // Si hay más de dos espacios, asumimos que la cadena tiene dos nombres y dos apellidos (o más)
            return { firstName: parts[0] + ' ' + parts[1], lastName: parts.slice(2).join(' ') };
        } else {
            // Si no se cumple ninguna de las condiciones anteriores, asumimos que la cadena no tiene un formato válido
            return { firstName: '', lastName: '' };
        }
    }

    private async verifyStep(data: KycWorkFlowEventDto, kycVerifcation: KycVerification) {
        if (data.step?.id === 'watchlists') return;
        try {
            console.log(data.step);
            const kycVerificationStep = await this.kycVerificationStepRepository.findOne({
                where: {
                    step: data.step?.id,
                    verification: { id: kycVerifcation.id },
                },
            });
            if (!kycVerificationStep) throw new BadRequestException('Step not found');

            if (data.step?.error === null) {
                await this.kycVerificationStepRepository.update(kycVerificationStep.id, { verified: true, error: undefined });
            } else {
                await this.kycVerificationStepRepository.update(kycVerificationStep.id, {
                    verified: false,
                    error: data.step?.error?.message,
                });
            }
        } catch (error) {
            console.log('revienta aqui ' + error);
        }
    }

    async rejectValidation(verificationId: string) {
        try {
            const token = await this.generateToken();
            const config = {
                method: 'PUT',
                url: `/v2/verifications/${verificationId}/status`,
                baseURL: this.BASE_URL,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    status: 'reject',
                },
            };
            await axios(config);
        } catch (error) {
            throw error;
        }
    }

    async forceValidation(verificationId: string) {
        try {
            const token = await this.generateToken();
            const config = {
                method: 'PUT',
                url: `/v2/verifications/${verificationId}/status`,
                baseURL: this.BASE_URL,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    status: 'verified',
                },
            };
            await axios(config);
        } catch (error) {
            throw error;
        }
    }

    async validate(authUser: AuthUser) {
        let duplicated: boolean = false;
        const kycVerification = await this.kycVerificationRepository.findOne({
            where: {
                user: { id: authUser.sub },
            },
        });
        if (kycVerification) {
            const kycUser = await this.getKycUser<MetaMapUser>(kycVerification.verificationId);
            if (kycUser.documents.length == 0) {
                return {
                    duplicated: false,
                };
            }
            const steps = kycUser.documents[0]?.steps;
            const relatedRecords = steps?.find((step) => step.id === 'duplicate-user-detection')?.data?.relatedRecords || [];
            for (let i = 0; i < relatedRecords.length; i++) {
                if (kycUser.identity.status === KycStatus.VERIFIED) {
                    duplicated = true;
                }
            }
            if (duplicated) {
                await this.kycVerificationRepository.update(kycVerification.id, { duplicated: true });
            } else {
                this.forceValidation(kycVerification.verificationId);
            }
        }
        return {
            duplicated: duplicated,
        };
    }

    async getKycVerification(authUser: AuthUser) {
        return await this.kycVerificationRepository.findOne({
            relations: {
                verificationSteps: true,
            },
            where: {
                user: { id: authUser.sub },
            },
        });
    }

    async getRawKyc(userId: string) {
        const verification = await this.kycVerificationRepository.findOne({
            relations: {
                verificationSteps: true,
            },
            where: {
                user: { id: userId },
            },
        });
        if (!verification) {
            return {};
        }
        const kycUser = await this.getKycUser<MetaMapUser>(verification.verificationId);
        if (kycUser.documents.length == 0) {
            return {};
        }

        const images = kycUser.documents[0]?.photos;
        const fields = kycUser.documents[0]?.fields ?? {};
        const fieldsArray = Object.keys(fields).map((key) => {
            let separatedKey = key
                .split(/(?=[A-Z])/)
                .join(' ')
                .toLowerCase();
            separatedKey = separatedKey.charAt(0).toUpperCase() + separatedKey.slice(1);
            return {
                name: separatedKey,
                value: fields[key]?.value,
            };
        });
        const liveness = kycUser.steps.find((step) => step.id == 'liveness')?.data;
        const watchlistsSteps = kycUser.steps.find((step) => step.id == 'watchlists')?.data ?? [];
        const watchlists = watchlistsSteps.map((watchlistStep) => {
            return {
                name: watchlistStep.watchlist.name,
                result: watchlistStep.searchResult,
            };
        });
        const result = {
            verification,
            images,
            liveness,
            watchlists,
            fields: fieldsArray,
        };
        return result;
    }
}
