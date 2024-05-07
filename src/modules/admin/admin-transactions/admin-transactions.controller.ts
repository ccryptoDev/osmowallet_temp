import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { GetTransactionsDto } from 'src/modules/transactions/dtos/getTransaction.dto';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { AdminTransactionsService } from './admin-transactions.service';
import { ApproveTransactionDto } from './dtos/approveFunding.dto';
import { CreateAdminTransactionDto } from './dtos/create-transaction.dto';
import { GetTransactionsMetricsDto } from './dtos/getTotalTransactions.dto';
import { NetFlowMetricDto } from './dtos/net-flow-metric.dto';
import { RejectTransactionDto } from './dtos/rejectTransaction.dto';
import { ValidateTransactionsBodyDto, ValidateTransactionsQueryDto } from './dtos/validateTransactions.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@UseGuards(AdminAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('admin/transactions')
@ApiBearerAuth()
@Controller('admin/transactions')
export class AdminTransactionsController {
    constructor(private adminTransactionService: AdminTransactionsService) {}

    @ApiOperation({ summary: 'Get net flow metrics' })
    @Get('/metrics/net-flow')
    async getNetFlow(@Query() query: NetFlowMetricDto) {
        return this.adminTransactionService.getNetFlowMetrics(query);
    }

    @ApiOperation({ summary: 'Get transactions metrics' })
    @Get('/metrics')
    async getMetrics(@Query() query: GetTransactionsMetricsDto) {
        const [totals, averages] = await Promise.all([
            this.adminTransactionService.getTotalTransactionsMetrics(query),
            this.adminTransactionService.getAverageTransactionMetrics(query),
        ]);
        return {
            totals,
            averages,
        };
    }

    @ApiOperation({ summary: 'Create a transaction' })
    @Post()
    createTransaction(@Body() body: CreateAdminTransactionDto) {
        return this.adminTransactionService.createTransaction(body);
    }

    @ApiOperation({ summary: 'Get raw transactions' })
    @Get('/raw')
    getRawTransactions(@Query() data: GetTransactionsDto, @Res() res: Response) {
        return this.adminTransactionService.getCSVTransactions(data, res);
    }

    @ApiOperation({ summary: 'Get transactions' })
    @Get()
    getTransactions(@Query() query: GetTransactionsDto) {
        return this.adminTransactionService.getTransactions(query);
    }

    @ApiOperation({ summary: 'Approve a transaction' })
    @Put('/:id/approve')
    approveTransaction(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: ApproveTransactionDto) {
        return this.adminTransactionService.approveTransaction(id, body);
    }

    @ApiOperation({ summary: 'Reject a transaction' })
    @Put('/:id/reject')
    rejectTransaction(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: RejectTransactionDto) {
        return this.adminTransactionService.rejectTransaction(id, body);
    }

    @ApiOperation({ summary: 'Validate transactions' })
    @Post('validate')
    async validateTransactions(@Body() { file }: ValidateTransactionsBodyDto, @Query() { fromDate, toDate }: ValidateTransactionsQueryDto) {
        return this.adminTransactionService.validateTransactions(file, fromDate, toDate);
    }
}
