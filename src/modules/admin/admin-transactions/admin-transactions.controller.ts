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
import { CSVTransactionDto } from './dtos/csvTransaction.dto';
import { GetTransactionsMetricsDto } from './dtos/getTotalTransactions.dto';
import { NetFlowMetricDto } from './dtos/net-flow-metric.dto';
import { RejectTransactionDto } from './dtos/rejectTransaction.dto';
import { ValidateTransactionsBodyDto, ValidateTransactionsQueryDto } from './dtos/validateTransactions.dto';

@UseGuards(AdminAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/transactions')
export class AdminTransactionsController {
    constructor(private adminTransactionService: AdminTransactionsService) {}

    @Get('/metrics/net-flow')
    async getNetFlow(@Query() query: NetFlowMetricDto) {
        return this.adminTransactionService.getNetFlowMetrics(query);
    }

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

    @Post()
    createTransaction(@Body() body: CreateAdminTransactionDto) {
        return this.adminTransactionService.createTransaction(body);
    }

    @Get('/raw')
    getRawTransactions(@Query() data: GetTransactionsDto, @Res() res: Response) {
        return this.adminTransactionService.getCSVTransactions(data, res);
    }

    @Get()
    getTransactions(@Query() query: GetTransactionsDto) {
        return this.adminTransactionService.getTransactions(query);
    }

    @Put('/:id/approve')
    approveTransaction(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @Body() body: ApproveTransactionDto,
    ) {
        return this.adminTransactionService.approveTransaction(id, body);
    }

    @Put('/:id/reject')
    rejectTransaction(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @Body() body: RejectTransactionDto,
    ) {
        return this.adminTransactionService.rejectTransaction(id, body);
    }

    @Post('validate')
    async validateTransactions(
        @Body() { file }: ValidateTransactionsBodyDto,
        @Query() { fromDate, toDate }: ValidateTransactionsQueryDto,
    ) {
        return this.adminTransactionService.validateTransactions(file, fromDate, toDate);
    }
}
