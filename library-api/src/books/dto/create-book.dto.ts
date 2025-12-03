import { IsNotEmpty, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: '1984' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '9780451524935', description: 'ISBN (10-13 characters)' })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({ example: 'uuid-of-author' })
  @IsUUID()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
