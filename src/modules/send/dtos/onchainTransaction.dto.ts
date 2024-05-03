import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { SendDto } from './send.dto';

export class CreateOnchainTransactionDto {
    @ApiProperty({
        description: 'The available balance',
        example: 1000,
    })
    @IsNumber()
    availableBalance!: number;

    @ApiProperty({
        description: 'The authenticated user',
        example: { id: 1, name: 'John Doe' },
    })
    @IsNotEmpty()
    user!: AuthUser;

    @ApiProperty({
        description: 'The payload for sending the transaction',
        example: { recipient: 'example@example.com', amount: 50 },
    })
    @IsNotEmpty()
    payload!: SendDto;
}
