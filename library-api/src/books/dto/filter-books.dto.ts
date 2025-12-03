import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterBooksDto {
  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsUUID()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by availability (true = available, false = not available)',
    type: Boolean 
  })
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({ description: 'Search by title (partial match)' })
  @IsOptional()
  search?: string;
}
