import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBorrowingDto {
  @ApiProperty({ example: 'uuid-of-book' })
  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}
