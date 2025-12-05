import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: '1984' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '9780451524935' })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({ example: 'uuid-of-author' })
  @IsUUID()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, description: 'Total copies of the book' })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 3, minimum: 0, description: 'Available copies (for lost book scenarios)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  availableQty?: number;
}
