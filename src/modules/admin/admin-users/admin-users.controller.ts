import {
    Controller,
    Query,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    ParseUUIDPipe,
    Put,
    Res,
    Patch,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { GetUserCSVDTO, GetUsersDto } from './dtos/getUsers.dto';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { GetTransactionsDto } from 'src/modules/transactions/dtos/getTransaction.dto';
import { TransactionMetricDto } from './dtos/transactionMetric.dto';
import { UpdateUserTier } from './dtos/updateUserTier.dto';
import { TiersService } from 'src/modules/tiers/tiers.service';
import { Response } from 'express';
import { WalletsService } from 'src/modules/wallets/wallets.service';
import { UpdateUsersDto } from './dtos/updateUser.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeaturesService } from 'src/modules/features/features.service';

@UseGuards(AdminAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
    constructor(
        private adminUsersService: AdminUsersService,
        private tierService: TiersService,
        private walletService: WalletsService,
        private featureService: FeaturesService
    ) {}

    @ApiOperation({ summary: 'Get wallet summary' })
    @Get('/wallets/summary')
    getWalletSummary() {
        return this.walletService.getSUMWalletUsers();
    }

    @ApiOperation({ summary: 'Get all raw users' })
    @Get('/raw')
    getAllRawUsers(@Res() response: Response, @Query() query: GetUserCSVDTO) {
        return this.adminUsersService.getUsersCSV(response, query);
    }

    @ApiOperation({ summary: 'Update user tier' })
    @Put('/:id/tier')
    updateUserTier(@Param('id') id: string, @Body() body: UpdateUserTier) {
        return this.tierService.updateTierUser(id, body.tierId);
    }

    @ApiOperation({ summary: 'Get tier by user ID' })
    @Get('/:id/tier')
    getTierByUserId(@Param('id') id: string) {
        return this.tierService.getTierByUserId(id);
    }

    @ApiOperation({ summary: 'Get all tiers' })
    @Get('/tiers')
    getTiers() {
        return this.tierService.getTiers();
    }

    @ApiOperation({ summary: 'Get transaction limits by user ID' })
    @Get('/:id/transaction-limits')
    getTransactionLimitsByUser(@Param('id') id: string) {
        return this.adminUsersService.getUserLimits(id);
    }

    @ApiOperation({ summary: 'Get all transaction metrics by user ID' })
    @Get('/:id/metrics/transactions')
    getAllTransactionMetricsByUser(@Param('id') id: string, @Query() query: TransactionMetricDto) {
        query.userId = id;
        return this.adminUsersService.getTransactionMetrics(query);
    }

    @ApiOperation({ summary: 'Get all transaction metrics' })
    @Get('/metrics/transactions')
    getAllTransactionMetrics(@Query() query: TransactionMetricDto) {
        return this.adminUsersService.getTransactionMetrics(query);
    }

    @ApiOperation({ summary: 'Get wallets by user ID' })
    @Get('/:id/wallets')
    getWallets(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.walletService.getWalletsByUser(id);
    }

    @ApiOperation({ summary: 'Get user transactions by user ID' })
    @Get('/:id/transactions')
    getUserTransactions(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Query() query: GetTransactionsDto) {
        return this.adminUsersService.getTransactionsByUser(id, query);
    }

    @ApiOperation({ summary: 'Get users metrics' })
    @Get('/metrics')
    getUsersMetrics() {
        return this.adminUsersService.getUserMetrics();
    }

    @ApiOperation({ summary: 'Resend email verification' })
    @Post('/:id/email/resend-verification')
    resendEmailVerification(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.resendEmailVerification(id);
    }

    @ApiOperation({ summary: 'Resend mobile verification' })
    @Post('/:id/mobile/resend-verification')
    resendMobileVerification(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.resendMobileVerification(id);
    }

    @ApiOperation({ summary: 'Get user KYC by user ID' })
    @Get('/:id/kyc')
    getUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.getKyc(id);
    }

    @ApiOperation({ summary: 'Force reject user KYC' })
    @Post('/:id/kyc/reject')
    forceRejectUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.rejectKyc(id);
    }

    @ApiOperation({ summary: 'Force verify user KYC' })
    @Post('/:id/kyc/verify')
    forceVerifyUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyKyc(id);
    }

    @ApiOperation({ summary: 'Force verify user email' })
    @Post('/:id/email/verify')
    forceVerifyUserEmail(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyEmail(id);
    }

    @ApiOperation({ summary: 'Force verify user mobile' })
    @Post('/:id/mobile/verify')
    forceVerifyUserMobile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyMobile(id);
    }

    @ApiOperation({ summary: 'Deactivate user' })
    @Post('/:id/deactivate')
    deactivateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.deactivateUser(id);
    }

    @ApiOperation({ summary: 'Activate user' })
    @Post('/:id/activate')
    activateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.activateUser(id);
    }

    @ApiOperation({ summary: 'Get users' })
    @Get()
    getUsers(@Query() query: GetUsersDto) {
        return this.adminUsersService.getUsers(query);
    }

    @ApiOperation({ summary: 'Update user' })
    @Patch(':id')
    updateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() updateUsersDto: UpdateUsersDto) {
        return this.adminUsersService.updateUser(id, updateUsersDto);
    }

    @ApiOperation({ summary: 'Get user features' })
    @Get(':id/features')
    getUserFeatures(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.featureService.getUserFeatureAvailabilitiesByUser(id)
    }

    @ApiOperation({summary: 'Activate Feature'})
    @Patch(':id/features/:id/active')
    activateUserFeature(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.featureService.activateUserFeature(id)
    }

    @ApiOperation({summary: 'Deactivate Feature'})
    @Patch(':id/features/:id/deactive')
    deactivateUserFeature(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.featureService.deactivateUserFeature(id)
    }
}
